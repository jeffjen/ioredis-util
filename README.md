# ioredis-util
utility for ioredis connection

### URI schema
- A single node  
     `redis://<addr-to-your-redis>:<port>`

- A group of sentinel targets     
     `sentinel://<sentinal-001>:<port>,<sentinel-002>:<port>,<sentinel-003>:<port>/<name-of-master>`

- A group of sentinel targets  
      `cluster://<node-001>:<port>,<node-002>:<port>,<node-003>:<port>`
