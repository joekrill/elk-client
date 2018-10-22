# elk-connect

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

const client = new ElkClient('elkm1s://someuser:supersecretpassword@192.168.0.251?timeout=30');

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
