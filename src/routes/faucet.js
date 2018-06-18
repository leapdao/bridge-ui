import React from 'react';
import requestApi from '../api';

const URL = 'https://sarrsmlpsg.execute-api.eu-west-1.amazonaws.com/v0';
const api = requestApi(URL);

const requestFund = tweetUrl => api('post', 'tweetFund', { tweetUrl });

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
    const { value, sending, error, success } = this.state;

    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Get tokens</h2>
        {success && <p style={{ color: '#00a' }}>{success}</p>}
        {error && <p style={{ color: '#d00' }}>{error}</p>}
        <label>
          Tweet url (tweet should countain your address):<br />
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
      </form>
    );
  }
}
