'use strict';

const Inverter = require('../inverter');
const { EnphaseApi } = require('./api');

class Enphase extends Inverter {
    onInit() {
        super.onInit();

        const data = this.getData();
        const settings = this.getSettings();
        this.enphaseApi = new EnphaseApi(settings.uid, settings.key, data.id);
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        // Enphase API will throw an error if new settings are invalid
        const enphaseApi = new EnphaseApi(newSettings.uid, newSettings.key, data.id);
        await enphaseApi.getProductionData();

        this.enphaseApi = enphaseApi;
    }

    async checkProduction() {
        this.log('Checking production');

        try {
            const productionData = await this.enphaseApi.getProductionData();

            let currentEnergy = 0;
            let currentPower = 0;

            if (productionData !== null) {
                currentEnergy = productionData.reduce((lastValue, report) => lastValue + report.enwh, 0) / 1000;
                currentPower = productionData[productionData.length - 1].powr;
            }

            this.setCapabilityValue('daily_production', currentEnergy);
            this.setCapabilityValue('production', currentPower);    

            if (!this.getAvailable()) {
                await this.setAvailable();
            }

            this.log(`Current energy is ${currentEnergy}kWh`);
            this.log(`Current power is ${currentPower}W`);
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
}

module.exports = Enphase;