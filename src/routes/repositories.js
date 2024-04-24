var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();


const getReposPersonal = async () => {
    const apiUrlPersonal = 'https://api.github.com/users/mdamonte88/repos';
    const apiUrlCompany = `https://api.github.com/orgs/Cencosud-Cencommerce/teams/be-prime/repos`;
    
    try {
        const response = type == 'company' ? 
                        await fetch(apiUrlCompany, { headers: {
                            Authorization: `token ${accessToken}`
                            }
                        }) :
                        await fetch(apiUrlPersonal);
        const data = await response.json();
        console.log('Fetched data:', data);

        // Obtener pull requests abiertos para cada repositorio
        const reposWithPRs = await Promise.all(data.map(async repo => {
            const { prCount, data } = await getOpenPullRequests(repo.name, accessToken);
            return {...repo, countOpenPullRequests: prCount, dataOpenPullRequests: data}; // Agrega la cuenta de PRs a la info del repositorio
        }));

        // Ordenar los repositorios por 'updated_at' en orden descendente
        reposWithPRs.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

        return reposWithPRs;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

const getReposCompany = async () => {
    const accessToken = process.env.GITHUB_TOKEN;
    const apiUrlCompany = `https://api.github.com/orgs/Cencosud-Cencommerce/teams/be-prime/repos`;

    try {
        let allRepos = [];

        let page = 1;
        let nextPageExists = true;

        // Continuar obteniendo repositorios hasta que no haya más páginas
        while (nextPageExists) {
            const response = await fetch(`${apiUrlCompany}?page=${page}&per_page=100`, {
                headers: { Authorization: `token ${accessToken}` }
            });

            const data = await response.json();
            if (data.length === 0) {
                // No hay más repositorios en la página actual, detener el bucle
                nextPageExists = false;
            } else {
                allRepos = allRepos.concat(data); // Concatenar los repositorios de la página actual a la lista completa
                page++; // Pasar a la siguiente página
            }
        }

        // Obtener pull requests abiertos para cada repositorio
        const reposWithPRs = await Promise.all(allRepos.map(async repo => {
            const { prCount, data } = await getOpenPullRequests(repo.name, accessToken);
            return { ...repo, countOpenPullRequests: prCount, dataOpenPullRequests: data }; // Agrega la cuenta de PRs a la info del repositorio
        }));

        // Ordenar los repositorios por 'pushed_at' en orden descendente
        reposWithPRs.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

        return reposWithPRs;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}


const getOpenPullRequests = async (repoName, accessToken) => {
    try {
        const response = await fetch(`https://api.github.com/repos/Cencosud-Cencommerce/${repoName}/pulls?state=open`, {
            headers: { Authorization: `token ${accessToken}` }
        });
        const pullRequests = await response.json();

        // Filtrar los pull requests creados por Dependabot
        const filteredPullRequests = pullRequests.filter(pr => pr.user.login !== 'dependabot[bot]');
        
        return {
            prCount: filteredPullRequests.length, 
            data: filteredPullRequests.map(pr => ({
                id: pr.id,
                url: pr.html_url,
                creator: pr.user.login // Aquí extraemos el login del usuario que creó el PR
            }))
        }; // Devuelve la cantidad de pull requests abiertos
    } catch (error) {
        console.error(`Error fetching pull requests for repo ${repoName}:`, error);
        return 0; // Retorna 0 en caso de error
    }
};


/* GET home page. */
router.get('/', async function(req, res, next) {
    const type = 'company';
    const data = await getReposCompany();
    res.status(200).send(data);
});

module.exports = router;




