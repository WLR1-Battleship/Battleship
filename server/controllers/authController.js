module.exports = {
  login: async (req, res) => {
    const db = req.app.get("db");
    const { username } = req.body;

    const [user] = await db.user.get(username);
    if (!user) {
      let [newuser] = await db.user.add(username);
      user = newuser;
    }

    const isAuthenticated = user;
    if (isAuthenticated) {
      req.session.user = user;
      return res.status(200).send(req.session.user);
    }
  },
  getUser: async (req,res) =>{
      if(req.session.user){
          res.status(200).send(req.session.user)
      }
      else{
          res.sendStatus(403)
      }
  }
};
