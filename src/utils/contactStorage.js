export function getContactMessages() {
    const data = localStorage.getItem("contactMessages");

    return data ? JSON.parse(data) : [];
}

export function saveContactMessages(messages) {
    localStorage.setItem(
        "contactMessages",
        JSON.stringify(messages)
    );
}

export function createContactMessage(messageData) {
    const messages = getContactMessages();

    const newMessage = {
        id: Date.now(),
        name: messageData.name,
        email: messageData.email,
        subject: messageData.subject,
        message: messageData.message,
        type: messageData.type,
        status: "new",
        createdAt: new Date().toISOString()
    };

    saveContactMessages([
        ...messages,
        newMessage
    ]);

    return newMessage;
}

export function updateContactMessageStatus(messageId, newStatus) {
    const messages = getContactMessages();

    const updatedMessages = messages.map((message) => {
        if (Number(message.id) === Number(messageId)) {
            return {
                ...message,
                status: newStatus,
                updatedAt: new Date().toISOString()
            };
        }

        return message;
    });

    saveContactMessages(updatedMessages);
}