const http = require('http');

const data = JSON.stringify({
    userId: 'user123',
    ticketId: 'ticket-uuid',
    price: 100
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/reserve',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-idempotency-key': 'stripe-test-script-' + Date.now()
    }
};

console.log("Sending request...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
