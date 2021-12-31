#!/usr/bin/env python3

from flask import Flask, request, make_response
from time import sleep

app = Flask(__name__)

@app.route('/respond')
def respond():
    time_to_sleep = int(request.args.get('time')) / 1000
    sleep(time_to_sleep)
    resp = make_response('Response from Flask')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route('/request_type')
def request_type():
    resp = make_response('Request Type: ' + request.method)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

# main driver function
if __name__ == '__main__':
    app.run()
