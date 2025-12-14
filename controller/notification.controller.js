import Notification from '../model/notification.model.js';

// İstifadəçinin bildirişlərini gətir
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;

    const filter = { user: req.user._id };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate('relatedListing', 'petType breed images status')
      .populate('relatedUser', 'name surname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirişlər əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Bildirişi oxunmuş kimi işarələ
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildiriş tapılmadı'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Bildiriş oxunmuş kimi işarələndi',
      data: notification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildiriş yenilənərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Bütün bildirişləri oxunmuş kimi işarələ
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Bütün bildirişlər oxunmuş kimi işarələndi',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirişlər yenilənərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Bildirişi sil
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildiriş tapılmadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildiriş silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildiriş silinərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Bütün bildirişləri sil
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Bütün bildirişlər silindi',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirişlər silinərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Oxunmamış bildiriş sayını gətir
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Oxunmamış bildiriş sayı əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};