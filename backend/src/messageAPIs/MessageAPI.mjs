class MessageAPI {
    async sendRequest() {
        throw new Error('You have to implement the method sendRequest!');
    }
    async sendRequestStreamResponse() {
        throw new Error('You have to implement the method sendRequestStreamResponse!');
    }
}

export default MessageAPI;