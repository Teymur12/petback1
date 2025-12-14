import Register from '../model/register.model.js';
import Listing from '../model/listing.model.js';
import Notification from '../model/notification.model.js';

// İstifadəçini blokla/blokdan çıxar
export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    // Admin özünü bloklaya bilməz
    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin istifadəçini bloklaya bilməzsiniz'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Əgər bloklanıbsa, bütün elanlarını da blokla
    if (user.isBlocked) {
      await Listing.updateMany(
        { user: userId },
        { isBlocked: true }
      );

      // Bildiriş göndər
      await Notification.create({
        user: userId,
        type: 'account_blocked',
        title: 'Hesabınız bloklanıb',
        message: 'Hesabınız administrator tərəfindən bloklanıb. Ətraflı məlumat üçün bizimlə əlaqə saxlayın.'
      });
    } else {
      // Blokdan çıxarıldıqda elanları da aç
      await Listing.updateMany(
        { user: userId },
        { isBlocked: false }
      );
    }

    res.status(200).json({
      success: true,
      message: user.isBlocked ? 'İstifadəçi bloklandı' : 'İstifadəçi blokdan çıxarıldı',
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Əməliyyat zamanı xəta baş verdi',
      error: error.message
    });
  }
};

// Admin tərəfindən bildiriş göndər
export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, message, type = 'admin_message' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Başlıq və mesaj tələb olunur'
      });
    }

    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      });
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Bildiriş göndərildi',
      data: notification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildiriş göndərilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Toplu bildiriş göndər
export const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type = 'admin_message' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'İstifadəçi ID-ləri tələb olunur'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Başlıq və mesaj tələb olunur'
      });
    }

    const notifications = userIds.map(userId => ({
      user: userId,
      type,
      title,
      message
    }));

    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `${result.length} istifadəçiyə bildiriş göndərildi`,
      count: result.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirişlər göndərilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Admin tərəfindən elanı sil (məcburi)
export const forceDeleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { reason } = req.body;

    const listing = await Listing.findById(listingId).populate('user');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Elan sahibinə bildiriş göndər
    await Notification.create({
      user: listing.user._id,
      type: 'listing_deleted',
      title: 'Elanınız silindi',
      message: reason || 'Elanınız administrator tərəfindən silindi.',
      relatedListing: listingId
    });

    await Listing.findByIdAndDelete(listingId);

    res.status(200).json({
      success: true,
      message: 'Elan silindi və istifadəçiyə bildiriş göndərildi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan silinərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Statistika
export const getStatistics = async (req, res) => {
  try {
    const totalUsers = await Register.countDocuments();
    const blockedUsers = await Register.countDocuments({ isBlocked: true });
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ 
      status: 'aktiv', 
      expiresAt: { $gt: new Date() },
      isBlocked: false 
    });
    const pairedListings = await Listing.countDocuments({ status: 'cütləşdirildi' });
    const expiredListings = await Listing.countDocuments({ status: 'vaxtı bitib' });
    const blockedListings = await Listing.countDocuments({ isBlocked: true });

    // Heyvan növlərinə görə statistika
    const listingsByPetType = await Listing.aggregate([
      { $match: { status: 'aktiv' } },
      { $group: { _id: '$petType', count: { $sum: 1 } } }
    ]);

    // Şəhərlərə görə statistika
    const listingsByCity = await Listing.aggregate([
      { $match: { status: 'aktiv' } },
      { $group: { _id: '$seher', count: { $sum: 1 } } },
      { $lookup: { from: 'cities', localField: '_id', foreignField: '_id', as: 'city' } },
      { $unwind: '$city' },
      { $project: { cityName: '$city.cityName', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          blocked: blockedUsers,
          active: totalUsers - blockedUsers
        },
        listings: {
          total: totalListings,
          active: activeListings,
          paired: pairedListings,
          expired: expiredListings,
          blocked: blockedListings
        },
        byPetType: listingsByPetType,
        byCity: listingsByCity
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Statistika əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};