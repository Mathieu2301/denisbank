import sha256 from 'crypto-js/sha256';
import $ from './request';
import loadSw from './serviceworker';

export default function api(izitoast) {
  return {
    login(form, cb = rs => rs) {
      if (
        form.email.length < 4
        || form.password.length < 4
      ) {
        izitoast.error('Please fill all fields');
      } else {
        // eslint-disable-next-line
        form.password = sha256(form.password).toString();
        $.ACCOUNT.LOGIN(form, (rs) => {
          if (rs.success) {
            localStorage.setItem('email', form.email);
            localStorage.setItem('session', rs.session);
            izitoast.success(rs.message);
          } else {
            izitoast.error(rs.message);
          }
          cb(rs);
        });
      }
    },

    register(form, cb = rs => rs) {
      if (
        form.fullname.length < 4
        || form.email.length < 4
        || form.password.length < 4
      ) {
        izitoast.error('Please fill all fields');
      } else if (form.password === form.confirm) {
        // eslint-disable-next-line
        form.password = sha256(form.password).toString();
        $.ACCOUNT.REGISTER(form, cb);
      } else {
        izitoast.error("Passwords doesn't match");
      }
    },

    addToken(token) {
      $.ACCOUNT.ADD_TOKEN({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        token,
      });
    },

    isConnected(cb) {
      if (localStorage.getItem('email') && localStorage.getItem('session')) {
        $.ACCOUNT.CHECK_SESSION({
          email: localStorage.getItem('email'),
          session: localStorage.getItem('session'),
        }, (rs) => {
          if (rs.success && window.location.protocol === 'https:') loadSw(this.addToken);
          cb(rs.success === true);
        });
      } else cb(false);
    },

    getInfos(cb) {
      $.ACCOUNT.GET({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
      }, (rs) => {
        if (rs.success) {
          cb(rs);
        } else {
          izitoast.error(rs.message);
        }
      });
    },

    searchUser(keyword, cb) {
      $.USER.SEARCH({ keyword }, (rs) => {
        if (rs.success) {
          cb(rs.data);
        } else {
          izitoast.error(rs.message);
        }
      });
    },

    sendDeal(form, cb) {
      let func = $.DEAL.NEW.SEND;
      if (form.type === 'ask') func = $.DEAL.NEW.ASK;
      if (
        form.target.email
        && form.target.email.length > 4

        && form.title
        && form.title.length > 2

        && form.amount
        && form.amount >= 0.01
      ) {
        func({
          email: localStorage.getItem('email'),
          session: localStorage.getItem('session'),
          target: form.target.email,
          title: form.title,
          amount: form.amount,
        }, (rs) => {
          if (rs.error) izitoast.error(rs.message);
          cb(rs);
        });
      } else izitoast.error('Please fill all fields');
    },

    payDeal(deal) {
      $.DEAL.PAY({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        deal,
      }, (rs) => {
        izitoast[rs.success ? 'success' : 'error'](rs.message);
      });
    },

    cancelDeal(deal) {
      $.DEAL.CANCEL({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        deal,
      }, (rs) => {
        izitoast[rs.success ? 'success' : 'error'](rs.message);
      });
    },

    getTrades(cb) {
      $.TRADING.GET_TRADES({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
      }, (rs) => {
        if (rs.error) izitoast.error(rs.message);
        cb(rs);
      });
    },

    newTrade(trade, cb) {
      $.TRADING.NEW_TRADE({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        ...trade,
      }, (rs) => {
        izitoast[rs.success ? 'success' : 'error'](rs.message);
        cb(rs);
      });
    },

    closeTrade(trade, cb) {
      $.TRADING.CLOSE_TRADE({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        trade,
      }, (rs) => {
        izitoast[rs.success ? 'success' : 'error'](rs.message);
        cb(rs);
      });
    },

    fetchMarkets(cb) {
      $.TRADING.FETCH_MARKETS({}, cb);
    },

    setFavMarkets(markets, cb) {
      $.TRADING.SET_FAV_MARKETS({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
        markets,
      }, (rs) => {
        izitoast[rs.success ? 'success' : 'error'](rs.message);
        cb(rs);
      });
    },

    onChanges(cb) {
      $.ACCOUNT.ONCHANGES({
        email: localStorage.getItem('email'),
        session: localStorage.getItem('session'),
      }, (rs) => {
        if (rs.error) {
          this.isConnected((connected) => {
            if (!connected) window.location.reload();
          });
        }
        if (rs.changes) cb(rs);
        this.onChanges(cb);
      });
    },
  };
}
