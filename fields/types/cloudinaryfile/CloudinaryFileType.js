/*!
 * Module dependencies.
 */

var _ = require('underscore'),
	keystone = require('../../../'),
	util = require('util'),
	cloudinary = require('cloudinary'),
	MPromise = require('mpromise'),
	utils = require('keystone-utils'),
	super_ = require('../Type');

/**
 * CloudinaryFile FieldType Constructor
 * @extends Field
 * @api public
 */

function cloudinaryfile(list, path, options) {

	this._underscoreMethods = ['format'];
	this._fixedSize = 'full';
	this._properties = ['select', 'selectPrefix', 'autoCleanup', 'folder', 'resourceType', 'rootUrl'];

	if (!('rootUrl' in options)) {
		var cloudinaryUrl = process.env.CLOUDINARY_URL
		var cloudName = cloudinaryUrl.substring(cloudinaryUrl.lastIndexOf('@') + 1);
		options.rootUrl = '//res.cloudinary.com/' + cloudName + '/';
	}

	// TODO: implement filtering, usage disabled for now
	options.nofilter = true;

	// TODO: implement initial form, usage disabled for now
	if (options.initial) {
		throw new Error(
			'Invalid Configuration\n\n' +
			'CloudinaryFile fields (' + list.key + '.' + path + ') do not currently support being used as initial fields.\n'
		);
	}

	cloudinaryfile.super_.call(this, list, path, options);

	// validate cloudinary config
	if (!keystone.get('cloudinary config')) {
		throw new Error(
			'Invalid Configuration\n\n' +
			'CloudinaryFile fields (' + list.key + '.' + this.path + ') require the "cloudinary config" option to be set.\n\n' +
			'See http://keystonejs.com/docs/configuration/#services-cloudinary for more information.\n'
		);
	}

}

/*!
 * Inherit from Field
 */

util.inherits(cloudinaryfile, super_);


/**
 * Registers the field on the List's Mongoose Schema.
 *
 * @api public
 */

cloudinaryfile.prototype.addToSchema = function() {

	var field = this,
		schema = this.list.schema;

	var paths = this.paths = {
		// cloudinary fields
		public_id: 		this._path.append('.public_id'),
		version: 		this._path.append('.version'),
		signature: 		this._path.append('.signature'),
		format: 		this._path.append('.format'),
		resource_type: 	this._path.append('.resource_type'),
		width: 			this._path.append('.width'),
		height: 		this._path.append('.height'),
		// virtuals
		exists: 		this._path.append('.exists'),
		folder: 		this._path.append('.folder'),
		// form paths
		upload: 		this._path.append('_upload'),
		action: 		this._path.append('_action'),
		select: 		this._path.append('_select')
	};

	var schemaPaths = this._path.addTo({}, {
		public_id:		String,
		version:		Number,
		signature:		String,
		format:			String,
		resource_type:	String,
		width:			Number,
		height:			Number
	});

	schema.add(schemaPaths);

	var exists = function(item) {
		return (item.get(paths.public_id) ? true : false);
	};

	// The .exists virtual indicates whether an file is stored
	schema.virtual(paths.exists).get(function() {
		return schemaMethods.exists.apply(this);
	});

	var folder = function(item) {//eslint-disable-line no-unused-vars
		var folderValue = null;

		if (keystone.get('cloudinary folders')) {
			if (field.options.folder) {
				folderValue = field.options.folder;
			} else {
				var folderList = keystone.get('cloudinary prefix') ? [keystone.get('cloudinary prefix')] : [];
				folderList.push(field.list.path);
				folderList.push(field.path);
				folderValue = folderList.join('/');
			}
		}

		return folderValue;
	};

	// The .folder virtual returns the cloudinary folder used to upload/select files
	schema.virtual(paths.folder).get(function() {
		return schemaMethods.folder.apply(this);
	});

	var src = function(item, options) {

		if (!exists(item)) {
			return '';
		}

		var resource_type = item.get(paths.resource_type);
		
		options = ('object' === typeof options) ? options : {};

		if (!('fetch_format' in options) && keystone.get('cloudinary webp') !== false) {
			options.fetch_format = 'auto';
		}

		if (!('progressive' in options) && keystone.get('cloudinary progressive') !== false) {
			options.progressive = true;
		}

		if (!('secure' in options) && keystone.get('cloudinary secure')) {
			options.secure = true;
		}

		if (resource_type === 'image' && !('use_root_path' in options)) {
			options.use_root_path = true;
		}

		options.version = item.get(paths.version);
		
		if (resource_type === 'image') {
			return cloudinary.url(item.get(paths.public_id) + '.' + item.get(paths.format), options);
		} else if (resource_type === 'raw') {
			options.resource_type = 'raw';
			return cloudinary.url(item.get(paths.public_id), options);
		} else if (resource_type === 'video') {
			options.resource_type = 'video';
			return cloudinary.url(item.get(paths.public_id), options);
		}
		return '';
	};

	var reset = function(item) {
		item.set(field.path, {
			public_id: '',
			version: 0,
			signature: '',
			format: '',
			resource_type: '',
			width: 0,
			height: 0
		});
	};

	var addSize = function(options, width, height, other) {
		if (width) options.width = width;
		if (height) options.height = height;
		if ('object' === typeof other) {
			_.extend(options, other);
		}
		return options;
	};

	var schemaMethods = {
		exists: function() {
			return exists(this);
		},
		folder: function() {
			return folder(this);
		},
		src: function(options) {
			return src(this, options);
		},
		tag: function(options) {
			return exists(this) ? cloudinary.image(this.get(field.path), options) : '';
		},
		scale: function(width, height, options) {
			return src(this, addSize({ crop: 'scale' }, width, height, options));
		},
		fill: function(width, height, options) {
			return src(this, addSize({ crop: 'fill', gravity: 'faces' }, width, height, options));
		},
		lfill: function(width, height, options) {
			return src(this, addSize({ crop: 'lfill', gravity: 'faces' }, width, height, options));
		},
		fit: function(width, height, options) {
			return src(this, addSize({ crop: 'fit' }, width, height, options));
		},
		limit: function(width, height, options) {
			return src(this, addSize({ crop: 'limit' }, width, height, options));
		},
		pad: function(width, height, options) {
			return src(this, addSize({ crop: 'pad' }, width, height, options));
		},
		lpad: function(width, height, options) {
			return src(this, addSize({ crop: 'lpad' }, width, height, options));
		},
		crop: function(width, height, options) {
			return src(this, addSize({ crop: 'crop', gravity: 'faces' }, width, height, options));
		},
		thumbnail: function(width, height, options) {
			return src(this, addSize({ crop: 'thumb', gravity: 'faces' }, width, height, options));
		},
		videoSrc: function(options) {
			var videoOptions = { format: this.get(paths.format) };

			if (options) _.extend(videoOptions, options);

			return src(this, videoOptions);
		},
		videoThumb: function(options) {
			var thumbOptions = { start_offset: '0', format: 'jpg' };

			if (options) _.extend(thumbOptions, options);

			return src(this, thumbOptions);
		},
		/**
		 * Resets the value of the field
		 *
		 * @api public
		 */
		reset: function() {
			reset(this);
		},
		/**
		 * Deletes the file from Cloudinary and resets the field
		 *
		 * @api public
		 */
		delete: function() {
			var promise = new MPromise();

			cloudinary.uploader.destroy(this.get(paths.public_id), function(result) {
				promise.fulfill(result);
			});
			reset(this);

			return promise;
		},
		/**
		 * Uploads the file to Cloudinary
		 *
		 * @api public
		 */
		upload: function(file, options) {
			var promise = new MPromise();

			cloudinary.uploader.upload(file, function(result) {
				promise.fulfill(result);
			}, options);

			return promise;
		}
	};

	_.each(schemaMethods, function(fn, key) {
		field.underscoreMethod(key, fn);
	});

	// expose a method on the field to call schema methods
	this.apply = function(item, method) {
		return schemaMethods[method].apply(item, Array.prototype.slice.call(arguments, 2));
	};

	this.bindUnderscoreMethods();
};


/**
 * Formats the field value
 *
 * @api public
 */

cloudinaryfile.prototype.format = function(item) {
	return item.get(this.paths.public_id);
};


/**
 * Detects whether the field has been modified
 *
 * @api public
 */

cloudinaryfile.prototype.isModified = function(item) {
	return item.isModified(this.paths.version);
};


/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

cloudinaryfile.prototype.validateInput = function(data) {//eslint-disable-line no-unused-vars
	// TODO - how should file field input be validated?
	return true;
};


/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

cloudinaryfile.prototype.updateItem = function(item, data) {
	var paths = this.paths;
	var setValue = function(key) {
		if (paths[key]) {
			var index = paths[key].indexOf('.');
			var field = paths[key].substr(0, index);
			// Note we allow implicit conversion here so that numbers submitted as strings in the data object
			// aren't treated as different values to the stored Number values
			if (data[field] && data[field][key] && data[field][key] != item.get(paths[key])) { // eslint-disable-line eqeqeq
				item.set(paths[key], data[field][key] || null);
			}
		}
	};

	_.each(['public_id', 'version', 'signature', 'format', 'resource_type', 'width', 'height'], setValue);
};


/**
 * Returns a callback that handles a standard form submission for the field
 *
 * Expected form parts are
 * - `field.paths.action` in `req.body` (`clear` or `delete`)
 * - `field.paths.upload` in `req.files` (uploads the file to cloudinary)
 *
 * @api public
 */

cloudinaryfile.prototype.getRequestHandler = function(item, req, paths, callback) {

	var field = this;

	if (utils.isFunction(paths)) {
		callback = paths;
		paths = field.paths;
	} else if (!paths) {
		paths = field.paths;
	}

	callback = callback || function() {};

	return function() {

		if (req.body) {
			var action = req.body[paths.action];

			if (/^(delete|reset)$/.test(action)) {
				field.apply(item, action);
			}
		}

		if (req.body && req.body[paths.select]) {

			cloudinary.api.resource(req.body[paths.select], function(result) {
				if (result.error) {
					callback(result.error);
				} else {
					item.set(field.path, result);
					callback();
				}
			});

		} else if (req.files && req.files[paths.upload] && req.files[paths.upload].size) {
			
			var tp = keystone.get('cloudinary prefix') || '';
			var fileDelete;

			if (tp.length) {
				tp += '_';
			}
			
			var resourceType = (field.options.resourceType) ? field.options.resourceType : 'auto';
			
			var uploadOptions = {
				tags: [tp + field.list.path + '_' + field.path, tp + field.list.path + '_' + field.path + '_' + item.id, tp + item.id],
				resource_type: resourceType
			};
			
			if (keystone.get('cloudinary folders')) {
				uploadOptions.folder = item.get(paths.folder);
			}

			if (keystone.get('cloudinary prefix')) {
				uploadOptions.tags.push(keystone.get('cloudinary prefix'));
			}

			if (keystone.get('env') !== 'production') {
				uploadOptions.tags.push(tp + 'dev');
			}

			uploadOptions.public_id = field.list.path + '/' + item.id + '/' + field.path + '/' + req.files[paths.upload].originalname.substring(0, req.files[paths.upload].originalname.lastIndexOf('.'));
			
			if (field.options.autoCleanup && item.get(field.paths.exists)) {
				// capture file delete promise
				fileDelete = field.apply(item, 'delete');
			}

			// callback to be called upon completion of the 'upload' method
			var uploadComplete = function(result) {
				if (result.error) {
					callback(result.error);
				} else {
					item.set(field.path, result);
					callback();
				}
			};
			
			// upload immediately if file is not being delete
			if (typeof fileDelete === 'undefined') {
				field.apply(item, 'upload', req.files[paths.upload].path, uploadOptions).onFulfill(uploadComplete);
			} else {
				// otherwise wait until file is deleted before uploading
				// this avoids problems when deleting/uploading files with the same public_id (issue #598)
				fileDelete.onFulfill(function(result) {
					if (result.error) {
						callback(result.error);
					} else {
						field.apply(item, 'upload', req.files[paths.upload].path, uploadOptions).onFulfill(uploadComplete);
					}
				});
			}

		} else {
			callback();
		}

	};

};


/**
 * Immediately handles a standard form submission for the field (see `getRequestHandler()`)
 *
 * @api public
 */

cloudinaryfile.prototype.handleRequest = function(item, req, paths, callback) {
	this.getRequestHandler(item, req, paths, callback)();
};


/*!
 * Export class
 */

exports = module.exports = cloudinaryfile;
