const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const urlBase = 'https://api.github.com';
const apiUrlPersonal = `${urlBase}/users/mdamonte88/repos`;
const apiUrlCompany = `${urlBase}/orgs/Cencosud-Cencommerce/teams/be-prime/repos`;
const type = 'personal'; // Puedes manejar este valor dinámicamente según sea necesario

const fetchWithAuth = async (url, accessToken = null) => {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.statusText}`);
  }
  return response.json();
};

const getReposPersonal = async () => {
  try {
    const repos = await fetchWithAuth(apiUrlPersonal);
    
    // Obtener pull requests abiertos para cada repositorio
    const reposWithPRs = await Promise.all(
      repos.map(async (repo) => {
        const { prCount, data } = await getOpenPullRequests(repo.name);
        return { ...repo, countOpenPullRequests: prCount, dataOpenPullRequests: data };
      })
    );
    
    // Ordenar los repositorios por 'updated_at' en orden descendente
    reposWithPRs.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

    return reposWithPRs;
  } catch (error) {
    console.error('Error fetching personal repos:', error);
    return [];
  }
};

const getReposCompany = async () => {
  const accessToken = process.env.CENCOSUD_GITHUB_TOKEN;
  let allRepos = [];
  let page = 1;
  let nextPageExists = true;

  try {
    while (nextPageExists) {
      const url = `${apiUrlCompany}?page=${page}&per_page=100`;
      const repos = await fetchWithAuth(url, accessToken);

      if (repos.length === 0) {
        nextPageExists = false;
      } else {
        allRepos = allRepos.concat(repos);
        page++;
      }
    }

    const detailedRepos = await Promise.all(
      allRepos.map(async (repo) => {
        const prs = await getOpenPullRequests(repo.name, accessToken);
        const lastCommit = await fetchWithAuth(`${repo.url}/commits/${repo.default_branch}`, accessToken);
        const events = await getRepositoryEvents(repo.name, accessToken);

        return {
          ...repo,
          lastCommitDate: lastCommit.commit?.author?.date || null,
          lastAuthor: lastCommit.commit?.author?.name || 'No commits found',
          countOpenPullRequests: prs.prCount,
          dataOpenPullRequests: prs.data,
          events, // Incluye los eventos del repositorio
        };
      })
    );

    // Ordenar por fecha de commit
    detailedRepos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

    return detailedRepos;
  } catch (error) {
    console.error('Error fetching company repos:', error);
    return [];
  }
};

const getOpenPullRequests = async (repoName, accessToken) => {
  const url = `${urlBase}/repos/${type === 'personal' ? 'mdamonte88' : 'Cencosud-Cencommerce'}/${repoName}/pulls?state=open`;

  try {
    const pullRequests = await fetchWithAuth(url, accessToken);
    const filteredPRs = pullRequests.filter((pr) => pr.user.login !== 'dependabot[bot]');

    return {
      prCount: filteredPRs.length,
      data: filteredPRs.map((pr) => ({
        id: pr.id,
        url: pr.html_url,
        creator: pr.user.login,
      })),
    };
  } catch (error) {
    console.error(`Error fetching pull requests for repo ${repoName}:`, error);
    return { prCount: 0, data: [] };
  }
};

const getRepositoryEvents = async (repoName, accessToken) => {
  try {
    const url = `${urlBase}/repos/Cencosud-Cencommerce/${repoName}/events`;
    return await fetchWithAuth(url, accessToken);
  } catch (error) {
    console.error(`Error fetching events for repo ${repoName}:`, error);
    return [];
  }
};

/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const data = await getReposPersonal();
    res.status(200).send(data);
  } catch (error) {
    console.error('Error in the route handler:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
