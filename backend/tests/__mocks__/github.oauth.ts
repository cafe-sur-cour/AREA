export const githubOAuth = {
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  getUserInfo: jest.fn(),
  storeUserToken: jest.fn(),
};