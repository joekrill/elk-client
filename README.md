# elk-client

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/joekrill/elk-client.svg)](https://greenkeeper.io/)
[![Travis](https://travis-ci.org/joekrill/elk-client.svg?branch=master)](https://travis-ci.org/joekrill/elk-message)
[![Coveralls](https://coveralls.io/repos/github/joekrill/elk-client/badge.svg)](https://coveralls.io/github/joekrill/elk-message)
[![Dev Dependencies](https://david-dm.org/joekrill/elk-client/dev-status.svg)](https://david-dm.org/joekrill/elk-message?type=dev)

A module for connecting to an [Elk M1](https://www.elkproducts.com/product-catalog/m1-gold-cross-platform-control) security system over a TCP connection.

### Usage

Install with NPM or Yarn

```
npm install elk-client
// or
yarn add elk-client
```

```
import { ElkClient } from 'elk-client';

// Parse a message

const client = new ElkClient({
  connection: { 
    host: 'elkm1.example.net',
    secure: true,
  },
  username: 'myelkm1username',
  password: 'supersecret!',
});

client
  .connect()
  .then(() => client.getArmingStatus())    
  .then((armingStatus) => {
    const area1 = armingStatus.getAreaStatus(1);
    console.log('Area 1 status:', ArmingLevel[area1.armingLevel])
  })
  .then(() => client.disconnect())
  .then(() => {
    console.log('Done!');
  })
  .catch((err) => {
    console.error(err);
  });
```

## Device discovery

Devices can be discovered using UDP broadcast messages. Only M1XEP and C1M1 devices can be discovered. This is not documented by Elk Products, but this is how the ElkRP2 software does it's discovery.

```
import { ElkDiscoveryClient } from 'elk-client';

const discoveryClient = new ElkDiscoveryClient();
discoveryClient
  .start()
  .then((devices) => {
    console.log(`Found `${devices.length}` devices!);
  })
  .catch((err) => {
    console.error(err);
  });
```

You can optionally limit the device types requested and adjust the timeout, broadcast address, and port used:

```
import { ElkDiscoveryClient, ElkDeviceType } from 'elk-client';

const discoveryClient = new ElkDiscoveryClient({
  // Only look for M1XEP devices
  deviceTypes: [ElkDeviceType.M1XEP],

  // Use port 9000 instead
  // NOTE: This probably won't ever work if you change the port!
  port: 9000,

  // Wait 10 seconds instead of the 5 second default
  timeout: 10000,

  // Use a different broadcast address (default is 255.255.255.255)
  broadcastAddress: "192.168.1.255",
});

discoveryClient
  .start()
  .then((devices) => {
    console.log(`Found `${devices.length}` devices!);
  })
  .catch((err) => {
    console.error(err);
  });
```

