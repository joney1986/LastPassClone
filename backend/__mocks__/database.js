const db = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn((query, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
        }
        // In our tests, the callback is the most important part for flow control.
        if (typeof callback === 'function') {
            callback(null);
        }
    }),
    serialize: jest.fn((callback) => {
        // The serialize callback should be executed to run the queries inside it.
        if (typeof callback === 'function') {
            callback();
        }
    }),
    close: jest.fn((callback) => {
        // The close callback should be executed for Jest to exit cleanly.
        if (typeof callback === 'function') {
            callback(null);
        }
    }),
};

module.exports = db;
