var _ = require('underscore'),
	$ = require('jquery'),
	React = require('react'),
	Field = require('../Field'),
	Note = require('../../components/Note'),
	Select = require('react-select');

var IMAGE_TYPES = ['image/gif', 'image/png', 'image/jpeg', 'image/bmp', 'image/x-icon', 'application/pdf', 'image/x-tiff', 'image/x-tiff', 'application/postscript', 'image/vnd.adobe.photoshop', 'image/svg+xml'];

module.exports = Field.create({

	displayName: 'CloudinaryFileField',

	fileFieldNode: function() {
		return this.refs.fileField.getDOMNode();
	},

	changeFile: function() {
		this.refs.fileField.getDOMNode().click();
	},

	getFileSource: function() {
		if (this.hasLocal()) {
			return this.state.localSource;
		} else if (this.hasExisting()) {
			return this.getFileURL();
		} else {
			return null;
		}
	},

	getFileURL: function() {
		if (!this.hasLocal() && this.hasExisting()) {
			if (this.props.value.resource_type === 'image') {
				return this.props.rootUrl + 'image/upload/v' + this.props.value.version + '/' + this.props.value.public_id;
			} else {
				return this.props.rootUrl + 'raw/upload/v' + this.props.value.version + '/' + this.props.value.public_id;
			}
		}
	},

	/**
	 * Reset origin and removal.
	 */
	undoRemove: function() {
		this.fileFieldNode().value = '';
		this.setState({
			removeExisting: false,
			localSource:    null,
			origin:         false,
			action:         null
		});
	},

	/**
	 * Check support for input files on input change.
	 */
	fileChanged: function (event) {
		var self = this;

		if (window.FileReader) {
			var files = event.target.files;
			_.each(files, function (f) {
				var isImage = (_.contains(IMAGE_TYPES, f.type));
				if (self.props.resourceType === 'image' && !isImage) {
					self.removeFile();
					alert('Unsupported file type. Supported formats are: GIF, PNG, JPG, BMP, ICO, PDF, TIFF, EPS, PSD, SVG');
					return false;
				}
				
				var filename = f.name;
				var fileReader = new FileReader();
				fileReader.onload = function (e) {
					if (!self.isMounted()) return;
					self.setState({
						isImage: isImage,
						localSource: e.target.result,
						filename: filename,
						origin: 'local'
					});
				};
				fileReader.readAsDataURL(f);
			});
		} else {
			this.setState({
				origin: 'local'
			});
		}
	},

	/**
	 * If we have a local file added then remove it and reset the file field.
	 */
	removeFile: function (e) {
		var state = {
			localSource: null,
			origin: false
		};

		if (this.hasLocal()) {
			this.fileFieldNode().value = '';
		} else if (this.hasExisting()) {
			state.removeExisting = true;

			if (this.props.autoCleanup) {
				if (e && e.altKey) {
					state.action = 'reset';
				} else {
					state.action = 'delete';
				}
			} else {
				if (e && e.altKey) {
					state.action = 'delete';
				} else {
					state.action = 'reset';
				}
			}
		}

		this.setState(state);
	},

	/**
	 * Is the currently active file uploaded in this session?
	 */
	hasLocal: function() {
		return this.state.origin === 'local';
	},

	/**
	 * Do we have an file preview to display?
	 */
	hasFile: function() {
		return this.hasExisting() || this.hasLocal();
	},

	/**
	 * Do we have an existing file?
	 */
	hasExisting: function() {
		return !!this.props.value.public_id;
	},

	/**
	 * Is this an image file?
	 */
	isImage: function() {
		var hasLocal = this.hasLocal();
		if (this.hasLocal()) {
			return this.state.isImage;
		} else if (this.hasExisting()) {
			return this.props.value.resource_type === 'image';
		}
		return false;
	},

	/**
	 * Render an file preview
	 */
	renderFilePreview: function() {
		var iconClassName;
		var className = 'image-preview';

		if (this.hasLocal()) {
			className += ' upload-pending';
			iconClassName = 'ion-upload upload-pending';
		} else if (this.state.removeExisting) {
			className += ' removed';
			iconClassName = 'delete-pending ion-close';
		}

		var body = [this.renderFilePreviewThumbnail()];
		if (iconClassName) body.push(<div key={this.props.path + '_preview_icon'} className={iconClassName} />);

		var url = this.getFileURL();

		if (url) {
			body = <a className='img-thumbnail' href={this.getFileURL()}>{body}</a>;
		} else {
			body = <div className='img-thumbnail'>{body}</div>;
		}

		return <div key={this.props.path + '_preview'} className={className}>{body}</div>;
	},

	renderFilePreviewThumbnail: function() {
		return <img key={this.props.path + '_preview_thumbnail'} className='img-load' style={{ height: '90' }} src={this.getFileSource()} />;
	},

	/**
	 * Render file details - leave these out if we're uploading a local file or
	 * the existing file is to be removed.
	 */
	renderFileDetails: function (add) {
		var values = null;
		
		if (!this.hasLocal() && !this.state.removeExisting) {
			var filename = this.props.value.public_id.substring(this.props.value.public_id.lastIndexOf('/') + 1);
			if (this.props.value.resource_type === 'image') {
				filename += '.' + this.props.value.format;
			}
				
			values = (
				<div className='image-values'>
					<a href={this.getFileURL()} className='field-value'>{filename}</a>
					{this.renderFileDimensions()}
				</div>
			);
		}

		return (
			<div key={this.props.path + '_details'} className='image-details'>
				{values}
				{add}
			</div>
		);
	},

	renderFileDimensions: function() {
		if (this.isImage()) {
			return <div className='field-value'>{this.props.value.width} x {this.props.value.height}</div>;
		} else {
			return <div></div>;
		}
	},

	/**
	 * Render an alert.
	 *
	 *  - On a local file, output a "to be uploaded" message.
	 *  - On a cloudinary file, output a "from cloudinary" message.
	 *  - On removal of existing file, output a "save to remove" message.
	 */
	renderAlert: function() {
		if (this.hasLocal()) {
			var filename = this.state.filename;
			return (
				<div className='upload-queued pull-left'>
					<div className='alert alert-success'>"{filename}" selected - save to upload</div>
				</div>
			);
		} else if (this.state.origin === 'cloudinary') {
			return (
				<div className='select-queued pull-left'>
					<div className='alert alert-success'>File selected from Cloudinary</div>
				</div>
			);
		} else if (this.state.removeExisting) {
			return (
				<div className='delete-queued pull-left'>
					<div className='alert alert-danger'>File {this.props.autoCleanup ? 'deleted' : 'removed'} - save to confirm</div>
				</div>
			);
		} else {
			return null;
		}
	},

	/**
	 * Output clear/delete/remove button.
	 *
	 *  - On removal of existing file, output "undo remove" button.
	 *  - Otherwise output Cancel/Delete file button.
	 */
	renderClearButton: function() {
		if (this.state.removeExisting) {
			return (
				<button type='button' className='btn btn-link btn-cancel btn-undo-image' onClick={this.undoRemove}>
					Undo Remove
				</button>
			);
		} else {
			var clearText;
			if (this.hasLocal()) {
				clearText = 'Cancel Upload';
			} else {
				clearText = (this.props.autoCleanup ? 'Delete File' : 'Remove File');
			}
			return (
				<button type='button' className='btn btn-link btn-cancel btn-delete-image' onClick={this.removeFile}>
					{clearText}
				</button>
			);
		}
	},

	renderFileField: function() {
		return <input ref='fileField' type='file' name={this.props.paths.upload} className='field-upload' onChange={this.fileChanged} />;
	},

	renderFileAction: function() {
		return <input type='hidden' name={this.props.paths.action} className='field-action' value={this.state.action} />;
	},

	renderFileToolbar: function() {
		return (
			<div key={this.props.path + '_toolbar'} className='image-toolbar'>
				<div className='pull-left'>
					<button type='button' onClick={this.changeFile} className='btn btn-default btn-upload-image'>
						{this.hasFile() ? 'Change' : 'Upload'} {(this.props.resourceType === 'image') ? 'Image' : 'File'}
					</button>
					{this.hasFile() && this.renderClearButton()}
				</div>
				{this.props.select && this.renderFileSelect()}
			</div>
		);
	},

	renderFileSelect: function() {
		var selectPrefix = this.props.selectPrefix;
		var getOptions = function(input, callback) {
			$.get('/keystone/api/cloudinary/autocomplete', {
				dataType: 'json',
				data: {
					q: input
				},
				prefix: selectPrefix
			}, function (data) {
				var options = [];

				_.each(data.items, function (item) {
					options.push({
						value: item.public_id,
						label: item.public_id
					});
				});

				callback(null, {
					options: options,
					complete: true
				});
			});
		};

		return (
			<div className='image-select'>
				<Select
					placeholder='Search for a file from Cloudinary ...'
					className='ui-select2-cloudinary'
					name={this.props.paths.select}
					id={'field_' + this.props.paths.select}
					asyncOptions={getOptions}
					/>
			</div>
		);
	},

	renderUI: function() {
        var container = [],
			body = [],
			hasFile = this.hasFile(),
			isImage = this.isImage(),
			fieldClassName = 'field-ui';

		if (hasFile) {
			fieldClassName += ' has-image';
		}

		if (this.shouldRenderField()) {
			if (hasFile) {
				if (isImage) {
					container.push(this.renderFilePreview());
				}
				container.push(this.renderFileDetails(this.renderAlert()));
			}

			body.push(this.renderFileToolbar());
		} else {
			if (hasFile) {
				if (isImage) {
					container.push(this.renderFilePreview());
				}
				container.push(this.renderFileDetails());
			} else {
				container.push(<div className='help-block'>no file</div>);
			}
		}

		return (
			<div className='field field-type-cloudinaryimage'>
				<label className='field-label'>{this.props.label}</label>

				{this.renderFileField()}
				{this.renderFileAction()}

				<div className={fieldClassName}>
					<div className='image-container'>{container}</div>
					{body}
					<Note note={this.props.note} />
				</div>
			</div>
		);
	}
});
