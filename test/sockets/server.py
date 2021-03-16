
#!/usr/bin/env python3

import asyncio
import websockets
import json

async def server(websocket, path):
  while True:
    # Get received data from websocket
    data = await websocket.recv()
    print ("Received: " + data)
    json_data = json.loads(data)
    if json_data.get('function') == 'echo':
      #echo back the first argument
      json_data['return'] = json_data['args'][0]
    elif json_data.get('function') == 'ask':
      #echo back the first argument
      json_data['return'] = input(json_data['args'][0])
    elif json_data.get('function') == 'throw':
      #throw the first argument
      json_data['throw'] = json_data['args'][0]
    elif not json_data.get('function') is None:
      json_data['throw'] = 'Unknown function : ' + json_data['function']

    # Send response back to client to acknowledge receiving message
    response = json.dumps(json_data)
    print ("Responding: " + response)
    await websocket.send(response)

# Create websocket server
start_server = websockets.serve(server, "localhost", 5150)

# Start and run websocket server forever
asyncio.get_event_loop().run_until_complete(start_server)
print("Starting loop")
asyncio.get_event_loop().run_forever()