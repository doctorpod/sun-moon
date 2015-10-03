require "sinatra"
require "logger"
require "time"
require "json"
require_relative "lib/yr_gateway"

$log = Logger.new(STDOUT)
$log.level = Logger::DEBUG

set :gateway, YrGateway.new

get "/" do
  File.read(File.join("public", "index.html"))
end

get "/data" do
  content_type :json
  settings.gateway.get.to_json
end
