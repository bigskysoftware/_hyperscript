#!/usr/bin/env python3

from flask import Flask, request, make_response
from time import sleep

app = Flask(__name__)

@app.route('/respond')
def hello_world():
    time_to_sleep = int(request.args.get('time')) / 1000
    sleep(time_to_sleep)
    resp = make_response('Response from Flask')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

# main driver function
if __name__ == '__main__':
    app.run()
