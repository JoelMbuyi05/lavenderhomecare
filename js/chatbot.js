// ============================================
// CHATBOT - FULLY FIXED
// ============================================

let chatState = {
    step: 0,
    name: '',
    email: '',
    phone: '',
    message: ''
};

const chatSteps = [
    {
        bot: "👋 Hello! I'm here to help you connect with Lavender Home Care.\n\nMay I have your <strong>name</strong>?",
        field: 'name',
        placeholder: 'Enter your name...',
        validate: (v) => v.trim().length > 1
    },
    {
        bot: "Nice to meet you, <strong>{name}</strong>! 😊\n\nWhat's your <strong>email address</strong>?",
        field: 'email',
        placeholder: 'your@email.com',
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    {
        bot: "Great! And your <strong>phone number</strong>? 📱",
        field: 'phone',
        placeholder: '+27 12 345 6789',
        validate: (v) => v.trim().length > 5
    },
    {
        bot: "Perfect! How can we help you today? 💬\n\nFeel free to share any questions or details about the care you need.",
        field: 'message',
        placeholder: 'Type your message here...',
        validate: (v) => v.trim().length > 2
    }
];

// ---- DOM Helpers ----
const $ = (id) => document.getElementById(id);

function addBotMessage(html) {
    const msgs = $('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = `
        <div class="chat-avatar">💜</div>
        <div class="chat-bubble bot-bubble">${html.replace(/\n/g, '<br>')}</div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function addUserMessage(text) {
    const msgs = $('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `<div class="chat-bubble user-bubble">${text}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
    const msgs = $('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="chat-avatar">💜</div>
        <div class="chat-bubble bot-bubble">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
    const t = $('typingIndicator');
    if (t) t.remove();
}

function botSay(html, delay = 900) {
    return new Promise(resolve => {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addBotMessage(html);
            resolve();
        }, delay);
    });
}

function updatePlaceholder() {
    const step = chatSteps[chatState.step];
    if (step) $('chatInput').placeholder = step.placeholder;
}

// ---- Send Handler ----
async function handleChatSend() {
    const input = $('chatInput');
    const val = input.value.trim();
    if (!val) return;

    if (chatState.step >= chatSteps.length) return;

    const step = chatSteps[chatState.step];

    // Validate
    if (!step.validate(val)) {
        addUserMessage(val);
        input.value = '';
        const errorMsgs = {
            name: "⚠️ Please enter your full name.",
            email: "⚠️ That doesn't look like a valid email. Please try again (e.g. jane@email.com)",
            phone: "⚠️ Please enter a valid phone number.",
            message: "⚠️ Please tell us a bit more so we can help you better."
        };
        await botSay(errorMsgs[step.field], 600);
        return;
    }

    addUserMessage(val);
    input.value = '';
    chatState[step.field] = val;
    chatState.step++;

    if (chatState.step < chatSteps.length) {
        const next = chatSteps[chatState.step].bot.replace('{name}', chatState.name);
        await botSay(next);
        updatePlaceholder();
    } else {
        await submitChat();
    }
}

// ---- Submit ----
async function submitChat() {
    await botSay(`Thank you, <strong>${chatState.name}</strong>! ✅<br><br>We've received your message and will contact you at <strong>${chatState.email}</strong> or <strong>${chatState.phone}</strong> within 24 hours. 💜`, 1000);

    // WhatsApp button
    setTimeout(() => {
        const msgs = $('chatMessages');
        const waText = encodeURIComponent(`Hi, I'm ${chatState.name}. ${chatState.message}`);
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.innerHTML = `
            <div class="chat-avatar">💜</div>
            <a href="https://wa.me/27123456789?text=${waText}" target="_blank" class="whatsapp-chat-btn">
                💬 Continue on WhatsApp
            </a>
        `;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }, 500);

    // Send emails
    try {
        const CUSTOMER_TEMPLATE = "template_qwlvpje";
        const ADMIN_TEMPLATE = "admin_notification";
        
        // 1. Send confirmation to customer
        await emailjs.send(EMAIL_SERVICE_ID, CUSTOMER_TEMPLATE, {
            to_email: chatState.email,
            subject: 'Message Received - Lavender Home Care',
            name: chatState.name,
            message_body: `Thank you for reaching out to Lavender Home Care!

We've received your message and will get back to you within 24 hours.

📞 Your Contact Information:
• Name: ${chatState.name}
• Email: ${chatState.email}
• Phone: ${chatState.phone}

💬 Your Message:
${chatState.message}

You can also reach us directly:
📞 +27 12 345 6789
💬 WhatsApp: https://wa.me/27123456789

We look forward to helping you!`
        });
        
        // 2. Send notification to admin
        await emailjs.send(EMAIL_SERVICE_ID, ADMIN_TEMPLATE, {
            subject: `💬 New Chat Message from ${chatState.name}`,
            notification_type: '💬 NEW CHAT MESSAGE',
            name: chatState.name,
            email: chatState.email,
            phone: chatState.phone,
            details: `📝 Message:
${chatState.message}

Reply to: ${chatState.email}
Call: ${chatState.phone}`,
            timestamp: `Message received: ${new Date().toLocaleString()}`
        });
        
        console.log('✅ Chat emails sent');
    } catch(e) { 
        console.error('❌ Email error:', e); 
    }

    // Save to Firebase
    try {
        if (typeof db !== 'undefined') {
            await db.collection('chat_messages').add({
                name: chatState.name,
                email: chatState.email,
                phone: chatState.phone,
                message: chatState.message,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });
            console.log('✅ Chat saved to Firebase');
        }
    } catch(e) { 
        console.error('❌ Firebase error:', e); 
    }

    console.log('Chat submitted:', chatState);
}

// ---- Open / Close ----
function openChat() {
    $('chatWidget').classList.add('active');
    $('chatToggle').classList.add('hidden-toggle');
    if (chatState.step === 0 && $('chatMessages').children.length === 0) {
        setTimeout(() => botSay(chatSteps[0].bot, 500), 200);
    }
}

function closeChat() {
    $('chatWidget').classList.remove('active');
    $('chatToggle').classList.remove('hidden-toggle');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', function () {
    $('chatToggle').onclick = openChat;
    $('chatClose').onclick = closeChat;

    $('chatSend').onclick = handleChatSend;
    $('chatInput').onkeypress = (e) => {
        if (e.key === 'Enter') handleChatSend();
    };

    // Close on outside click
    document.addEventListener('click', function (e) {
        const widget = $('chatWidget');
        const toggle = $('chatToggle');
        if (
            widget && widget.classList.contains('active') &&
            !widget.contains(e.target) &&
            !toggle.contains(e.target)
        ) {
            closeChat();
        }
    });
});