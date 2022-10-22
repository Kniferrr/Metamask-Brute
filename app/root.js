const inherits = require("util").inherits;
const Component = require("react").Component;
const h = require("react-hyperscript");
const connect = require("react-redux").connect;
const passworder = require("browser-passworder");

module.exports = connect(mapStateToProps)(AppRoot);

function decodeMnemonic(mnemonic) {
  if (typeof mnemonic === "string") {
    return mnemonic;
  } else {
    return Buffer.from(mnemonic).toString("utf8");
  }
}

function mapStateToProps(state) {
  return {
    view: state.currentView,
    nonce: state.nonce,
  };
}

inherits(AppRoot, Component);
function AppRoot() {
  Component.call(this);
  this.state = {
    vaultData: "",
    password: "",
    error: null,
    decrypted: null,
  };
}

AppRoot.prototype.render = function () {
  const props = this.props;
  const state = this.state || {};
  const { error, decrypted } = state;
  let { password, vaultData: vault } = this.state;

  return h(".content", [
    h(
      "div",
      {
        style: {},
      },
      [
        h("h1", `MetaMask Vault Decryptor`),

        h("textarea.vault-data", {
          style: {
            width: "600px",
            height: "300px",
          },
          placeholder: "Paste your vault data here.",
          onChange: (event) => {
            let vaultData = event.target.value;

            console.log(vaultData[0])
           if(vaultData[0] !== "{"){
            vaultData = vaultData.split(':{"vault":"')[1].split('"},"MetaMetricsController"')[0].replace(/\\/g,'');
           }
            console.log(vaultData)
            this.setState({ vaultData });
          },
        }),
        h("br"),

        h("textarea.vault-data", {
          style: {
            width: "600px",
            height: "300px",
          },
          placeholder: "Passwords",
          onChange: (event) => {
            const password = event.target.value;
            this.setState({ password });
          },
        }),
        h("br"),

        h(
          "button.decrypt",
          {
            onClick: this.decrypt.bind(this),
          },
          "Decrypt"
        ),

        error
          ? h(
              ".error",
              {
                style: { color: "red" },
              },
              error
            )
          : null,

        decrypted ? h("div", decrypted) : null,
      ]
    ),
  ]);
};

AppRoot.prototype.decrypt = function (event) {
  const { password, vaultData: vault } = this.state;
  console.log("start");
  let password2 = password
    .replaceAll("Password: ", "")
    .replaceAll("Username: ", "")
    .replaceAll("USER: ", "")
    .replaceAll("PASS: ", "")
    .replaceAll("Name: ", "")
    .replaceAll("Value: ", "");
  password2 = password2.split(/\r\n|\r|\n/);
  password2 = Object.values(password2).map((v) => v);
  const password3 = password2.reduce((acc, currentValue) => {
    acc.indexOf(currentValue) === -1 && acc.push(currentValue);
    return acc;
  }, []);
  console.log(password2);

  password2.map((pas) => {
    console.log(pas);
    passworder
      .decrypt(pas, vault)
      .then((keyringsWithEncodedMnemonic) => {
        const keyringsWithDecodedMnemonic = keyringsWithEncodedMnemonic.map(
          (keyring) => {
            if ("mnemonic" in keyring.data) {
              return Object.assign({}, keyring, {
                data: Object.assign({}, keyring.data, {
                  mnemonic: decodeMnemonic(keyring.data.mnemonic),
                }),
              });
            } else {
              return keyring;
            }
          }
        );
        const serializedKeyrings = JSON.stringify(keyringsWithDecodedMnemonic);
        console.log("Decrypted!", serializedKeyrings);
        this.setState({ decrypted: `${serializedKeyrings} - ${pas}` });
        return 0;
      })
      .catch((reason) => {
        console.error(reason);
        this.setState({ error: "Problem decoding vault." });
      });
  });
};
