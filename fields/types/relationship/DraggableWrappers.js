import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import {
	SortableHandle,
	SortableElement,
	SortableContainer
} from 'react-sortable-hoc';

/**
 * Draggable handle wraps the label
 */
const DragHandle = SortableHandle(({ children }) => <span>{children}</span>);

DragHandle.propTypes = {
	children: PropTypes.node
};

/**
 * Sortable wrapper for item, mirrors the Value component
 * https://github.com/JedWatson/react-select/blob/master/src/Value.js
 */
const DraggableItem = SortableElement(({ id, value, children, onRemove }) => {
	let dragging = false;

	const removeIt = (event) => {
		event.preventDefault();
		event.stopPropagation();
		onRemove(value);
	};

	const handleTouchEndRemove = (event) => {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (dragging) return;

		// Fire the mouse events
		removeIt(event);
	};

	const handleTouchMove = () => {
		// Set a flag that the view is being dragged
		dragging = true;
	};

	const handleTouchStart = () => {
		// Set a flag that the view is not being dragged
		dragging = false;
	};

	const containerStyles = {
		display: 'inline-block',
		'vertical-align': 'top'
	}
	return (
		<div style={containerStyles} className="Select-value-container">
			<div className='Select-value'>
				<span
					className="Select-value-icon"
					aria-hidden="true"
					onMouseDown={removeIt}
					onTouchEnd={handleTouchEndRemove}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
				>
					&times;
				</span>
				<span className="Select-value-label" role="option" aria-selected="true" id={id}>
					{children}
				</span>
			</div>
		</div>
	);
});

DraggableItem.propTypes = {
	id: PropTypes.string,
	value: PropTypes.object,
	onRemove: PropTypes.func,
	children: PropTypes.node,
};

/**
 * Hacky wrapping element necessary to pull index to pass to SortableElement
 */
const DraggableItemWrap = ({ id, ...props }) => {
	let index = 0;

	// Reselect passes an id with a # after -value. This number
	// starts from 0 and increments by 1 so we are parsing that value
	// and using it as the index
	id.replace(/.*?-value-(.*)?$/igm, (m, p1) => {
		index = parseInt(p1, 10);
	});

	return <DraggableItem id={id} index={index} {...props} />;
};

DraggableItemWrap.propTypes = {
	children: PropTypes.node,
	disabled: PropTypes.bool,               // disabled prop passed to ReactSelect
	id: PropTypes.string,                   // Unique id for the value - used for aria
	onClick: PropTypes.func,                // method to handle click on value label
	onRemove: PropTypes.func,               // method to handle removal of the value
	value: PropTypes.object.isRequired,     // the option object for this value
};

/**
 * Sortable wrapper for list
 */
const DraggableList = SortableContainer(({ children }) => children);

DraggableList.propTypes = {
	children: PropTypes.node,
};

export {
	DragHandle,
	DraggableItemWrap,
	DraggableList,
};
