import React from 'react';
import moment from 'moment';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';

var DateColumn = React.createClass({
	displayName: 'DateColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
		linkTo: React.PropTypes.string,
	},
	getValue () {
		const value = this.props.data.fields[this.props.col.path];
		if (!value) return null;

		const format = (this.props.col.type === 'datetime') ? 'MM/DD/YYYY, h:mm a' : 'MM/DD/YYYY';
		const isUTC = this.props.col.field.isUTC;

		return isUTC ? moment.utc(value).format(format) : moment(value).format(format);
	},
	render () {
		const value = this.getValue();
		const empty = !value && this.props.linkTo ? true : false;
		return (
			<ItemsTableCell>
				<ItemsTableValue field={this.props.col.type} to={this.props.linkTo} empty={empty}>
					{value}
				</ItemsTableValue>
			</ItemsTableCell>
		);
	},
});

module.exports = DateColumn;
