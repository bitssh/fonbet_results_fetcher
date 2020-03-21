console.log('initialized');
const fetch = require('node-fetch');


async function fetchData (date) {
    const url = 'https://clientsapi31.bkfon-resource.ru/results/results.json.php?locale=ru&lastUpdate=0&_=1584813939640&lineDate=2020-03-20';
    let response = await fetch(url);
    if (!response.ok) {
        console.error(`${new Date().toLocaleString()} ${response.status} - ${await response.text()}`.red);
        return;
    }
    const responseText = await response.text();
    console.log(JSON.parse(responseText));

}

function saveData(data) {

}


fetchData();
