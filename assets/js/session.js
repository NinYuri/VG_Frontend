const Session = (function() {
  let token = null;
  let user = null;

  return {
    setToken: function(newToken) {
      token = newToken;
      sessionStorage.setItem('jwt', newToken);
    },

    getToken: function() {
      if(token) return token;
      const storedT = sessionStorage.getItem('jwt');
      if(storedT) {
        token = storedT;
        return token;
      }
      return null;
    },

    setUser: function(newUser) {
      user = newUser;
      sessionStorage.setItem('user', newUser);
    },

    getUser: function() {
      if(user) return user;
      const storedU = sessionStorage.getItem('user');
      if(storedU) {
        user = storedU;
        return user;
      }
      return null;
    },

    clearAll: function() {
      user = null;
      token = null;
      sessionStorage.removeItem('jwt');
      sessionStorage.removeItem('user');
    },
  };
})();