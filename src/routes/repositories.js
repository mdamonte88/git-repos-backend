var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();

const getRepos = async () => {
    const apiUrl = 'https://api.github.com/users/mdamonte88/repos';
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log('Fetched data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
    const data = await getRepos();
    res.status(200).send(data);
});

module.exports = router;




