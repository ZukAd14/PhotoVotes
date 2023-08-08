const Photo = require('../models/photo.model');
const Voters = require('../models/Voters.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

const escapeHtml = (unsafe) => {
  return unsafe.replace(/[&<"']/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return match;
    }
  });
};

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      const escapedTitle = escapeHtml(title);
      const escapedAuthor = escapeHtml(author);
      const escapedEmail = escapeHtml(email);

      const fileName = file.path.split('/').slice(-1)[0];
      const fileExt = fileName.split('.').slice(-1)[0];

      if (
        (fileExt === '.gif' || fileExt === '.png' || fileExt === '.jpg') &&
        escapedTitle.length <= 25 &&
        escapedAuthor.length <= 50 &&
        escapedEmail.includes('@')
      ) {
        const newPhoto = new Photo({
          title: escapedTitle,
          author: escapedAuthor,
          email: escapedEmail,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save();
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  const ipAdress = requestIp.getClientIp(req);
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
    }
    const existingVote = await Voters.findOne({ user: ipAdress });

    if(!existingVote) {
      const newVote = new Voters({ user: ipAdress, votes: [req.params.id] });
      await newVote.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      return res.status(200).json({ message: 'OK' });
    } else {
      if(!existingVote.votes.includes(req.params.id)) {
        existingVote.votes.push(req.params.id);
        await existingVote.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        return res.status(200).json({ message: 'OK' });
      } else {
      return res.status(500).json({ message: 'Already voted for this photo' });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
