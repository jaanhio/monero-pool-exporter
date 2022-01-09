const express = require('express');
const axios = require('axios');

const app = express();

const promClient = require('prom-client');
promClient.collectDefaultMetrics();

const rewardsUrl = process.env.REWARDS_URL;

if (!rewardsUrl) {
    console.log('Missing rewardsUrl');
    process.exit(1);
}

new promClient.Gauge({
    name: 'pending_xmr_rewards',
    help: 'Value of XMR reward',
    async collect() {
        const response = await axios.get(rewardsUrl);
        const { data } = response;
        const { balance, thold } = data;
        const pendingRewards = Number(balance) / thold / 10; // somehow value shown on minexmr's dashboard is balance / thold / 10, so im just following that
        this.set(Number(pendingRewards.toFixed(6)));
    }
});

app.get('/metrics', async (req, res) => {
    try {
		res.set('Content-Type', promClient.register.contentType);
		res.end(await promClient.register.metrics());
	} catch (ex) {
		res.status(500).end(ex);
	}
})

const port = process.env.NODE_PORT || 3000;

app.listen(port, () => {
    console.log('monero-pool-exporter is listening on port ', port);
});