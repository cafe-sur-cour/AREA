export const t = jest.fn();
export const changeLanguage = jest.fn();

export const createInstance = jest.fn().mockReturnValue({
  t,
  changeLanguage,
  init: jest.fn(),
});
