import Listing from '../model/listing.model.js';
import Register from '../model/register.model.js';
import Notification from '../model/notification.model.js';

// Elan yarat
export const createListing = async (req, res) => {
  try {
    const { petType, gender, breed, age, description, images, seher } = req.body;

    // Validation
    if (!petType || !gender || !breed || !description || !images || !seher) {
      return res.status(400).json({
        success: false,
        message: 'Bütün məcburi xanaları doldurun'
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ən azı bir şəkil əlavə edin'
      });
    }

    // İstifadəçi bloklanıb yoxla
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız bloklanıb. Elan yarada bilməzsiniz'
      });
    }

    // Elan yarat
    const listing = await Listing.create({
      user: req.user._id,
      petType,
      gender,
      breed,
      age,
      description,
      images,
      seher
    });

    // Populate et
    await listing.populate([
      { path: 'user', select: 'name surname telefon email' },
      { path: 'seher', select: 'cityName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Elan uğurla yaradıldı',
      data: listing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan yaradılarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Bütün elanları gətir (filtrlə)
export const getAllListings = async (req, res) => {
  try {
    const { seher, petType, gender, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (seher) filter.seher = seher;
    if (petType) filter.petType = petType;
    if (gender) filter.gender = gender;
    if (status) filter.status = status;

    // Sadəcə aktiv elanları göstər (admin deyilsə)
    if (!req.user?.isAdmin) {
      filter.status = 'aktiv';
      filter.expiresAt = { $gt: new Date() };
      filter.isBlocked = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(filter)
      .populate('user', 'name surname telefon email')
      .populate('seher', 'cityName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    // Vaxtı keçmiş elanları yoxla və yenilə
    for (let listing of listings) {
      if (listing.checkExpiration()) {
        await listing.save();
      }
    }

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: listings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elanlar əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Şəhərə görə elanları gətir
export const getListingsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { petType, gender, page = 1, limit = 20 } = req.query;

    const filter = {
      seher: cityId,
      status: 'aktiv',
      expiresAt: { $gt: new Date() },
      isBlocked: false
    };

    if (petType) filter.petType = petType;
    if (gender) filter.gender = gender;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(filter)
      .populate('user', 'name surname telefon email')
      .populate('seher', 'cityName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: listings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elanlar əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// İstifadəçinin elanlarını gətir
export const getUserListings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Sadəcə öz elanlarını və ya admin
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur'
      });
    }

    const filter = { user: userId };
    if (status) filter.status = status;

    const listings = await Listing.find(filter)
      .populate('seher', 'cityName')
      .populate('pairRequests.user', 'name surname telefon email')
      .populate('pairRequests.listing', 'petType breed images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elanlar əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Tək elanı gətir
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate('user', 'name surname telefon email')
      .populate('seher', 'cityName')
      .populate('pairRequests.user', 'name surname telefon email')
      .populate('pairRequests.listing', 'petType breed images');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Baxış sayını artır (elan sahibi deyilsə)
    if (listing.user._id.toString() !== req.user._id.toString()) {
      listing.views += 1;
      await listing.save();
    }

    res.status(200).json({
      success: true,
      data: listing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan əldə edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Elanı yenilə
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Sadəcə elan sahibi və ya admin yeniləyə bilər
    if (listing.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu elanı yeniləmək üçün icazəniz yoxdur'
      });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'user', select: 'name surname telefon email' },
      { path: 'seher', select: 'cityName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Elan uğurla yeniləndi',
      data: updatedListing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan yenilənərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Elan vaxtını uzat
export const extendListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.body; // Default 30 gün

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Sadəcə elan sahibi uzada bilər
    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu elanı uzatmaq üçün icazəniz yoxdur'
      });
    }

    // Vaxtı uzat
    const currentExpiry = listing.expiresAt > new Date() ? listing.expiresAt : new Date();
    listing.expiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    listing.status = 'aktiv';

    await listing.save();

    res.status(200).json({
      success: true,
      message: `Elan ${days} gün uzadıldı`,
      data: listing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan uzadılarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Elanı sil
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Sadəcə elan sahibi və ya admin silə bilər
    if (listing.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu elanı silmək üçün icazəniz yoxdur'
      });
    }

    await Listing.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Elan uğurla silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Elan silinərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Cütləşdirmə sorğusu göndər
export const sendPairRequest = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { myListingId, message } = req.body;

    if (!myListingId) {
      return res.status(400).json({
        success: false,
        message: 'Öz elanınızı seçin'
      });
    }

    const targetListing = await Listing.findById(listingId).populate('user', 'name surname');
    const myListing = await Listing.findById(myListingId);

    if (!targetListing || !myListing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Elanlar aktiv olmalıdır
    if (targetListing.status !== 'aktiv' || myListing.status !== 'aktiv') {
      return res.status(400).json({
        success: false,
        message: 'Sadəcə aktiv elanlara sorğu göndərə bilərsiniz'
      });
    }

    // Öz elanına sorğu göndərə bilməz
    if (targetListing.user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Öz elanınıza sorğu göndərə bilməzsiniz'
      });
    }

    // Öz elanı olmalıdır
    if (myListing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu elan sizə aid deyil'
      });
    }

    // Yoxla ki, artıq sorğu göndərilməyib
    const existingRequest = targetListing.pairRequests.find(
      pr => pr.user.toString() === req.user._id.toString() &&
            pr.listing.toString() === myListingId &&
            pr.status === 'gözləyir'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Artıq bu elana sorğu göndərmisiniz'
      });
    }

    // Sorğu əlavə et
    targetListing.pairRequests.push({
      user: req.user._id,
      listing: myListingId,
      message: message || '',
      status: 'gözləyir'
    });

    await targetListing.save();

    // Elan sahibinə bildiriş göndər
    await Notification.create({
      user: targetListing.user._id,
      type: 'pair_request',
      title: 'Yeni cütləşdirmə sorğusu',
      message: `${req.user.name} ${req.user.surname} elanınıza cütləşdirmə sorğusu göndərdi`,
      relatedListing: listingId,
      relatedUser: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Cütləşdirmə sorğusu göndərildi',
      data: targetListing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sorğu göndərilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Cütləşdirmə sorğusuna cavab ver
export const respondToPairRequest = async (req, res) => {
  try {
    const { listingId, requestId } = req.params;
    const { status } = req.body; // 'qəbul edildi' və ya 'rədd edildi'

    if (!['qəbul edildi', 'rədd edildi'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Yanlış status'
      });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    // Sadəcə elan sahibi cavab verə bilər
    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu sorğuya cavab vermək üçün icazəniz yoxdur'
      });
    }

    const request = listing.pairRequests.id(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Sorğu tapılmadı'
      });
    }

    request.status = status;

    // Əgər qəbul edilibsə, elanın statusunu dəyiş
    if (status === 'qəbul edildi') {
      listing.status = 'cütləşdirildi';
    }

    await listing.save();

    // Sorğu göndərənə bildiriş göndər
    await Notification.create({
      user: request.user,
      type: status === 'qəbul edildi' ? 'pair_accepted' : 'pair_rejected',
      title: status === 'qəbul edildi' ? 'Sorğunuz qəbul edildi' : 'Sorğunuz rədd edildi',
      message: status === 'qəbul edildi' 
        ? `${req.user.name} ${req.user.surname} cütləşdirmə sorğunuzu qəbul etdi` 
        : `${req.user.name} ${req.user.surname} cütləşdirmə sorğunuzu rədd etdi`,
      relatedListing: listingId,
      relatedUser: req.user._id
    });

    res.status(200).json({
      success: true,
      message: status === 'qəbul edildi' ? 'Sorğu qəbul edildi' : 'Sorğu rədd edildi',
      data: listing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cavab göndərilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Admin: Elanı blokla/blokdan çıxar
export const toggleBlockListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate('user', 'name surname email');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Elan tapılmadı'
      });
    }

    listing.isBlocked = !listing.isBlocked;
    await listing.save();

    // Elan sahibinə bildiriş göndər
    if (listing.isBlocked) {
      await Notification.create({
        user: listing.user._id,
        type: 'listing_blocked',
        title: 'Elanınız bloklandı',
        message: 'Elanınız administrator tərəfindən bloklandı. Ətraflı məlumat üçün bizimlə əlaqə saxlayın.',
        relatedListing: id
      });
    }

    res.status(200).json({
      success: true,
      message: listing.isBlocked ? 'Elan bloklandı' : 'Elan blokdan çıxarıldı',
      data: listing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Əməliyyat zamanı xəta baş verdi',
      error: error.message
    });
  }
};

// Axtarış funksiyası
export const searchListings = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Axtarış sorğusu tələb olunur'
      });
    }

    const searchFilter = {
      status: 'aktiv',
      expiresAt: { $gt: new Date() },
      isBlocked: false,
      $or: [
        { breed: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(searchFilter)
      .populate('user', 'name surname telefon email')
      .populate('seher', 'cityName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: listings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Axtarış zamanı xəta baş verdi',
      error: error.message
    });
  }
};