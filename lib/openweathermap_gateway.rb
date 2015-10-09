require "httparty"
require "time"

class OpenweathermapGateway
  CACHE_TTL = 3600 * 2

  def initialize(api_key)
    @logger = Logger.new(STDOUT)
    @logger.level = Logger::DEBUG
    @data = nil
    @last_timestamp = 0
    @api_key = api_key
  end

  def get(lat = 50.84, lon = -0.14)
    now = Time.now

    if (now.to_i - @last_timestamp) < CACHE_TTL
      @logger.info "Using cached data"
      return @data
    end

    @logger.info "Fetching data from openweathermap"
    response = HTTParty.get(url(lat, lon))

    if response.code == 200
      @last_timestamp = response.parsed_response["dt"]
      @data = response.parsed_response
    else
      { error: true, message: response.message }
    end
  end

  private

  def url(lat, lon)
    "http://api.openweathermap.org/data/2.5/weather?lat=#{lat}&lon=#{lon}&units=metric&APPID=#{@api_key}"
  end
end
