'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const pathName = '/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceID=1&DataCollection=CommonInverterData';

class Fronius extends Inverter {
    getCronString() {
        return '* * * * *';
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        var dataUrl = `http://${data.ip}${pathName}`;

        fetch(dataUrl)
            .then(result => {
                if (result.ok) {
                    if (!this.getAvailable()) {
                        this.setAvailable().then(result => {
                            this.log('Available');
                        }).catch(error => {
                            this.error('Setting availability failed');
                        })
                    }

                    return result.json();
                } else {
                    throw result.status;
                }
            })
            .then(response => {
                const lastUpdate = response.Head.Timestamp;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });

                    const currentEnergy = Number(response.Body.Data.DAY_ENERGY.Value / 1000);
                    this.setCapabilityValue('meter_power', currentEnergy);

                    const currentPower = Number(response.Body.Data.PAC.Value);
                    this.setCapabilityValue('measure_power', currentPower);

                    this.log(`Current energy is ${currentEnergy}kWh`);
                    this.log(`Current power is ${currentPower}W`);
                } else {
                    this.log(`No new data`);
                }
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (HTTP ${error})`);
            });
    }
}

module.exports = Fronius;