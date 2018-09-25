require "httparty"
require "time"

class YrGateway
  DAY = 86400
  DAY50MINS = DAY + 3000
  MAX_LOOKAHEAD = DAY * 10
  MIN_LOOKAHEAD = DAY * 3

  def initialize
    @logger = Logger.new(STDOUT)
    @logger.level = Logger::DEBUG
    @data = {}
    @max_event_unix = 0
  end

  def get(lat, lon)
    now = Time.now
    cache_key = "#{(lat*100).round} #{(lon*100).round}"

    if @data[cache_key] && (@data[cache_key][:sun].last[:unix_t] - now.to_i) > MIN_LOOKAHEAD
      @logger.info "Using cached data"
      return @data[cache_key]
    end

    date_from = (now - DAY).strftime("%Y-%m-%d")
    date_to = (now + MAX_LOOKAHEAD).strftime("%Y-%m-%d")
    u = url(lat, lon, date_from, date_to)
    @logger.info "Fetching data form YR: #{u}"

    response = HTTParty.get(u)
    sun_events = []
    moon_events = []

    if response.code == 200
      response.parsed_response["astrodata"]["time"].each do |time|
        sun_rise = time["location"]["sun"]["rise"]
        sun_set = time["location"]["sun"]["set"]
        moon_rise = time["location"]["moon"]["rise"]
        moon_set = time["location"]["moon"]["set"]
        phase = phase_to_fraction(time["location"]["moon"]["phase"])

        sun_events << sun_event("rise", sun_rise)
        sun_events << sun_event("set", sun_set)
        moon_events << moon_event("rise", moon_rise, phase) if moon_rise
        moon_events << moon_event("set", moon_set, phase) if moon_set
      end

      sun_events = sort(sun_events)
      moon_events = interpolate_moon_events(sort(moon_events))
      @max_event_unix = [sun_events.last[:unix_t], moon_events.last[:unix_t]].sort.last

      @data[cache_key] = { sun: sun_events, moon: moon_events }
    else
      { error: true, message: response.message }
    end
  end

  private

  # Inserts any missing rises or sets because YR sometimes omitts rise or set
  # times.
  #
  # We use the fact that the moon, on average rises and sets about 50 mins
  # later than the previous day
  def interpolate_moon_events(events)
    cleaned_events = []
    prev_type = nil

    events.each_with_index do |event, i|
      if event[:type] == prev_type
        needed_type = prev_type == "rise" ? "set" : "rise"

        if i > 1
          unix_t = events[i-2][:unix_t] + DAY50MINS
        else
          unix_t = events[i+1][:unix_t] - DAY50MINS
        end

        cleaned_events << {
          type: needed_type,
          unix_t: unix_t,
          t: Time.at(unix_t).utc.iso8601,
          phase: event[:phase],
          interpolated: true
        }
      end

      prev_type = event[:type]
      cleaned_events << event
    end

    cleaned_events
  end

  def moon_event(event_type, time, phase, interpolated = false)
    {
      type: event_type,
      unix_t: Time.parse(time).to_i,
      t: time,
      interpolated: interpolated,
      phase: phase
    }
  end

  def sort(events)
    events.sort { |a, b| a[:unix_t] <=> b[:unix_t] }
  end

  def sun_event(event_type, time)
    {
      type: event_type,
      unix_t: Time.parse(time).to_i,
      t: time
    }
  end

  def url(lat, lon, date_from, date_to)
    "http://api.met.no/weatherapi/sunrise/1.1/?lat=#{lat};lon=#{lon};from=#{date_from};to=#{date_to}"
  end

  def phase_to_fraction(words)
    {
      "New moon" => 0.0,
      "Waxing crescent" => 0.125,
      "First quarter" => 0.25,
      "Waxing gibbous" => 0.375,
      "Full moon" => 0.5,
      "Waning gibbous" => 0.625,
      "Third quarter" => 0.75,
      "Waning crescent" => 0.875
    }[words]
  end
end
