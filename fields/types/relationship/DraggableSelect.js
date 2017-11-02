// DraggableSelect Wraps react-select to allow multi-select values to
// draggable for reordering. This was based on a solution from a
// github issue: https://github.com/JedWatson/react-select/issues/91#issuecomment-311239694
// The gist with the solution: https://gist.github.com/aschmoe/5cf05ebec29d140f9bf0ad2c31d6a3cb

import React, { Component } from 'react';
import Select from 'react-select';
import { arrayMove } from 'react-sortable-hoc';
import {
	DragHandle,
	DraggableItemWrap,
	DraggableList
} from './DraggableWrappers';

/**
 * Draggable react select
 */
class DraggableSelect extends Component {
	valueRenderer = option => (<DragHandle>{option.name}</DragHandle>)

	// Function for setting array on drag
	onSortEnd = ({ oldIndex, newIndex }) => {
		this.props.updateOrder(arrayMove(this.props.value, oldIndex, newIndex));
	}

	render() {
		const {
			multi,
			disabled,
			loadOptions,
			labelKey,
			name,
			onChange,
			value,
			valueKey
		} = this.props;

		return (
			<DraggableList
				axis="xy"
				shouldCancelStart={() => value && value.length < 2}
				onSortEnd={props => this.onSortEnd(props)}
				useDragHandle={true}
				helperClass="Select--multi Select--dragging"
			>
				<Select.Async
					multi={multi}
					disabled={disabled}
					loadOptions={loadOptions}
					labelKey={labelKey}
					name={name}
					onChange={onChange}
					simpleValue
					value={value}
					valueKey={valueKey}
					valueRenderer={this.valueRenderer}
					valueComponent={DraggableItemWrap}
				/>
			</DraggableList>
		);
	}
}

export default DraggableSelect;
