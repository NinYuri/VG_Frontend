/* ================================ TOKEN JWT  ================================ */
const Session = (function() {
  let token = null;
  let user = null;

  return {
    // TOKEN
    setToken: function(newToken, newUser) {
      token = newToken;
      localStorage.setItem('jwt', newToken);
    },

    getToken: function() {
      if(token) return token;
      const storedT = localStorage.getItem('jwt');
      if(storedT) {
        token = storedT;
        return token;
      }
      return null;
    },
    
    clearToken: function() {
      token = null;
      localStorage.removeItem('jwt');
    },

    // USER
    setUser: function(newUser) {
      user = newUser;
      localStorage.setItem('user', newUser);
    },

    getUser: function() {
      if(user) return user;
      const storedU = localStorage.getItem('user');
      if(storedU) {
        user = storedU;
        return user;
      }
      return null;
    },
    
    clearUser: function() {
      user = null;
      localStorage.removeItem('user');
    }
  };
})();