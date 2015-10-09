require "sinatra"
require "logger"
require "time"
require "json"
require_relative "lib/yr_gateway"
require_relative "lib/openweathermap_gateway"

$log = Logger.new(STDOUT)
$log.level = Logger::DEBUG

set :yr_gateway, YrGateway.new
set :openweathermap_gateway, OpenweathermapGateway.new("140ec3a7f05495ab87690279a98f93c7")

get "/" do
  File.read(File.join("public", "index.html"))
end

get "/data" do
  content_type :json
  {
    sunmoon: settings.yr_gateway.get,
    weather: settings.openweathermap_gateway.get
  }.to_json
end
