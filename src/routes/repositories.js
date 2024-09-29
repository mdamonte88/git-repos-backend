var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();


const urlBase = 'https://api.github.com'
const apiUrlPersonal = `${urlBase}/users/mdamonte88/repos`;
const apiUrlCompany = `${apiUrlPersonal}/orgs/Cencosud-Cencommerce/teams/be-prime/repos`;
const type = 'personal';

const getReposPersonal = async () => {
    
    try {
        const response = await fetch(apiUrlPersonal);
        const data = await response.json();
        //console.log('Fetched data:', data);

        // Obtener pull requests abiertos para cada repositorio
        const reposWithPRs = await Promise.all(data.map(async repo => {
            const { prCount, data } = await getOpenPullRequests(repo.name);
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
    const accessToken = process.env.CENCOSUD_GITHUB_TOKEN;
    console.log('accessToken', accessToken);
    const apiUrlCompany = `https://api.github.com/orgs/Cencosud-Cencommerce/teams/be-prime/repos`;

    try {
        let allRepos = [];

        let page = 1;
        let nextPageExists = true;

        // Continuar obteniendo repositorios hasta que no haya más páginas
        if (nextPageExists) {
            console.log('nextPageExists', nextPageExists)
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

        const detailedRepos = await Promise.all(allRepos.map(async repo => {
            const prs = await getOpenPullRequests(repo.name, accessToken);
            const lastCommitResponse = await fetch(`${repo.url}/commits/${repo.default_branch}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const lastCommit = await lastCommitResponse.json();
            const events = await getRepositoryEvents(repo.name, accessToken); // Llamada a getRepositoryEvents

            // Asegúrate de que lastCommit y lastCommit.commit existen antes de acceder a sus propiedades
            if (lastCommit && lastCommit.commit && lastCommit.commit.author) {
                return {
                    ...repo,
                    lastCommitDate: lastCommit.commit.author.date,
                    lastAuthor: lastCommit.commit.author.name,
                    countOpenPullRequests: prs.prCount,
                    dataOpenPullRequests: prs.data,
                };
            } else {
                return {
                    ...repo,
                    lastCommitDate: null,
                    lastAuthor: 'No commits found',
                    lastBranch: repo.default_branch,
                    countOpenPullRequests: prs.prCount,
                    dataOpenPullRequests: prs.data
                };
            }
        }));

        // Ordenar los repositorios por 'pushed_at' en orden descendente
        detailedRepos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

        console.log('detailedRepos', detailedRepos);

        return detailedRepos;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}


const getOpenPullRequests = async (repoName, accessToken) => {

    console.log('/n/n OpenPull Request /n/n')

    try {
        const urlBase = type ? apiUrlPersonal:
            'https://api.github.com/repos/Cencosud-Cencommerce/'

        const response = await fetch(`$${urlBase}/${repoName}/pulls?state=open`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });
        const pullRequests = await response.json();

        const filteredPullRequests = pullRequests.filter(pr => pr.user.login !== 'dependabot[bot]');
        
        return {
            prCount: filteredPullRequests.length,
            data: filteredPullRequests.map(pr => ({
                id: pr.id,
                url: pr.html_url,
                creator: pr.user.login
            }))
        };
    } catch (error) {
        console.error(`Error fetching pull requests for repo ${repoName}:`, error);
        return { prCount: 0, data: [] }; // En caso de error, retorna valores vacíos apropiados
    }
};


const getRepositoryEvents = async (repoName, accessToken) => {
    try {
        const response = await fetch(`https://api.github.com/repos/Cencosud-Cencommerce/${repoName}/events`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const events = await response.json();
        return events; // Retorna los eventos del repositorio
    } catch (error) {
        console.error(`Error fetching events for repo ${repoName}:`, error);
        return []; // Retorna un arreglo vacío en caso de error
    }
};

/* GET home page. */
router.get('/', async function(req, res, next) {
    const type = 'company';
    console.log('Pase por aca')
    const data = await getReposPersonal();
    console.log('Obtuve los repositorios por aca')
    res.status(200).send(data);
});

module.exports = router;




