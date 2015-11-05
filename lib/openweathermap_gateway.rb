require "httparty"
require "time"

class OpenweathermapGateway
  CACHE_TTL = 3600 * 2

  def initialize(api_key)
    @logger = Logger.new(STDOUT)
    @logger.level = Logger::DEBUG
    @data = {}
    @api_key = api_key
  end

  def get(lat, lon)
    @logger.info "OpenweathermapGateway called with lat: #{lat}, lon: #{lon}"
    now_unix = Time.now.to_i
    cache_key = "#{(lat*100).round} #{(lon*100).round}"

    if @data[cache_key] && (now_unix - @data[cache_key]["dt"]) < CACHE_TTL
      @logger.info "Using cached data"
      return @data[cache_key]
    end

    @logger.info "Fetching data from openweathermap: #{url(lat, lon)}"
    response = HTTParty.get(url(lat, lon))

    if response.code == 200
      @data[cache_key] = response.parsed_response
    else
      { error: true, message: response.message }
    end
  end

  private

  def url(lat, lon)
    "http://api.openweathermap.org/data/2.5/weather?lat=#{lat}&lon=#{lon}&units=metric&APPID=#{@api_key}"
  end
end
