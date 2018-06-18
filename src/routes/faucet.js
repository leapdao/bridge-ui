import React from 'react';
import requestApi from '../api';

const URL = 'https://sarrsmlpsg.execute-api.eu-west-1.amazonaws.com/v0';
const api = requestApi(URL);

const requestFund = tweetUrl => api('post', 'tweetFund', { tweetUrl });

const buttonCss = `
.twitter-share-button {
  inherit: none;
  height: 24px;
  display: inline-block;
  border-radius: 3px;
  background: linear-gradient(#FEFEFE 0%, #DFDFDF 100%);
  border: 1px solid #ccc;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 2px;

  font-weight: bold;
  font-size: 18px;

  color: #333333;
  text-decoration: none;
}
.twitter-share-button:hover {
  background: linear-gradient(#f7f7f7 0%, #d9d9d9 100%);
}`;

export default class Faucet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      sending: false,
      error: null,
      success: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ sending: true });
    requestFund(this.state.value)
      .then(() => {
        this.setState({
          value: '',
          sending: false,
          success: 'Cool! Wait a minute, we are sending tokens to you',
        });
      })
      .catch(err => {
        this.setState({ sending: false, error: err.message });
      });
  }

  render() {
    const { account } = this.props;
    const { value, sending, error, success } = this.state;
    const tweetText = `Requesting faucet funds into ${account} on the @Parsec_Labs test network.`;

    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Get tokens</h2>
        {success && <p style={{ color: '#00a' }}>{success}</p>}
        {error && <p style={{ color: '#d00' }}>{error}</p>}
        <label>
          Tweet url (<a
            href="https://twitter.com/intent/tweet?text=Requesting%20faucet%20funds%20into%200x0000000000000000000000000000000000000000%20on%20the%20%40Parsec_Labs%20test%20network."
            target="_about:blank"
          >
            tweet
          </a>{' '}
          should countain your address):<br />
          <input
            value={value}
            style={{ width: 400 }}
            onChange={e =>
              this.setState({
                value: e.target.value,
                success: null,
                error: null,
              })
            }
          />
        </label>
        <br />
        <button type="submit" disabled={sending}>
          Submit
        </button>
        <hr />
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          className="twitter-share-button"
        >
          Make a tweet
        </a>

        <style
          type="text/css"
          dangerouslySetInnerHTML={{ __html: buttonCss }}
        />
      </form>
    );
  }
}
