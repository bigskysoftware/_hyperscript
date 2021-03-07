
#!/usr/bin/env python3

import asyncio
import websockets
import json

async def server(websocket, path):
    # Get received data from websocket
    data = await websocket.recv()
    json_data = json.loads(data)
    print("Calleed " + json_data['function'])
    #echo back the first argument
    json_data['response'] = json_data['args'][0]
    # Send response back to client to acknowledge receiving message
    await websocket.send(json.dumps(json_data))

# Create websocket server
start_server = websockets.serve(server, "localhost", 5150)

# Start and run websocket server forever
asyncio.get_event_loop().run_until_complete(start_server)
print("Starting loop")
asyncio.get_event_loop().run_forever()