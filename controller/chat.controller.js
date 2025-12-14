import Chat from '../model/chat.model.js';
import Register from '../model/register.model.js';

// İstifadəçi chat yaradır və ya mövcud chat-ə mesaj göndərir
export const sendMessageToAdmin = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj tələb olunur'
      });
    }

    let chat = await Chat.findOne({ user: userId });

    if (!chat) {
      chat = await Chat.create({
        user: userId,
        messages: [{
          sender: userId,
          senderType: 'user',
          message: message.trim()
        }],
        lastMessage: message.trim(),
        lastMessageAt: Date.now(),
        unreadCount: {
          user: 0,
          admin: 1
        }
      });
    } else {
      chat.messages.push({
        sender: userId,
        senderType: 'user',
        message: message.trim()
      });
      chat.lastMessage = message.trim();
      chat.lastMessageAt = Date.now();
      chat.unreadCount.admin += 1;
      chat.status = 'active';
      await chat.save();
    }

    await chat.populate('user', 'name surname email telefon');
    await chat.populate('messages.sender', 'name surname isAdmin');

    res.status(201).json({
      success: true,
      message: 'Mesaj göndərildi',
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Admin istifadəçiyə cavab verir
export const replyToUser = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const adminId = req.user.id;

    if (!chatId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID və mesaj tələb olunur'
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı'
      });
    }

    chat.messages.push({
      sender: adminId,
      senderType: 'admin',
      message: message.trim()
    });
    chat.lastMessage = message.trim();
    chat.lastMessageAt = Date.now();
    chat.unreadCount.user += 1;
    chat.unreadCount.admin = 0;
    await chat.save();

    await chat.populate('user', 'name surname email telefon');
    await chat.populate('messages.sender', 'name surname isAdmin');

    res.status(200).json({
      success: true,
      message: 'Cavab göndərildi',
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// İstifadəçi öz chat-ini görür
export const getUserChat = async (req, res) => {
  try {
    const userId = req.user.id;

    const chat = await Chat.findOne({ user: userId })
      .populate('user', 'name surname email telefon')
      .populate('messages.sender', 'name surname isAdmin');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı. İlk mesajınızı göndərin'
      });
    }

    chat.unreadCount.user = 0;
    chat.messages.forEach(msg => {
      if (msg.senderType === 'admin' && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
      }
    });
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Admin bütün chat-ləri görür
export const getAllChats = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const users = await Register.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { surname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.user = { $in: users.map(u => u._id) };
    }

    const skip = (page - 1) * limit;

    const chats = await Chat.find(query)
      .populate('user', 'name surname email telefon seher')
      .populate('messages.sender', 'name surname isAdmin')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chat.countDocuments(query);

    res.status(200).json({
      success: true,
      data: chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Admin spesifik chat-i görür
export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id)
      .populate('user', 'name surname email telefon seher')
      .populate('messages.sender', 'name surname isAdmin');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı'
      });
    }

    chat.unreadCount.admin = 0;
    chat.messages.forEach(msg => {
      if (msg.senderType === 'user' && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
      }
    });
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Chat-i bağla (Admin)
export const closeChat = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı'
      });
    }

    chat.status = 'closed';
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat bağlandı',
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Chat-i sil (Admin)
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı'
      });
    }

    await Chat.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Chat silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Mesaj sil
export const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat tapılmadı'
      });
    }

    const messageIndex = chat.messages.findIndex(
      msg => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj tapılmadı'
      });
    }

    const message = chat.messages[messageIndex];

    if (!isAdmin && message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajı silmək üçün icazəniz yoxdur'
      });
    }

    chat.messages.splice(messageIndex, 1);
    
    if (chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      chat.lastMessage = lastMsg.message;
      chat.lastMessageAt = lastMsg.createdAt;
    } else {
      chat.lastMessage = '';
      chat.lastMessageAt = Date.now();
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Mesaj silindi',
      data: chat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};

// Oxunmamış mesaj sayı
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const chat = await Chat.findOne({ user: userId });

    if (!chat) {
      return res.status(200).json({
        success: true,
        unreadCount: 0
      });
    }

    res.status(200).json({
      success: true,
      unreadCount: chat.unreadCount.user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server xətası',
      error: error.message
    });
  }
};
