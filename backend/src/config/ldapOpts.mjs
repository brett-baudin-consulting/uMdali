export default {
    server: {
      url: process.env.LDAP_URL,
      bindDN: process.env.BIND_DN,
      bindCredentials: process.env.BIND_CREDENTIALS,
      searchBase: process.env.SEARCH_BASE,
      searchFilter: process.env.SEARCH_FILTER,
    }
  };