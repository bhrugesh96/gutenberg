/**
 * WordPress dependencies
 */
import {
	computeCaretRect,
	focus,
	isHorizontalEdge,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
	isRTL,
} from '@wordpress/dom';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getBlockClientId } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';

/**
 * Returns true if the element should consider edge navigation upon a keyboard
 * event of the given directional key code, or false otherwise.
 *
 * @param {Element} element     HTML element to test.
 * @param {number}  keyCode     KeyboardEvent keyCode to test.
 * @param {boolean} hasModifier Whether a modifier is pressed.
 *
 * @return {boolean} Whether element should consider edge navigation.
 */
export function isNavigationCandidate( element, keyCode, hasModifier ) {
	const isVertical = keyCode === UP || keyCode === DOWN;

	// Currently, all elements support unmodified vertical navigation.
	if ( isVertical && ! hasModifier ) {
		return true;
	}

	const { tagName } = element;

	// Native inputs should not navigate horizontally, unless they are simple types that don't need left/right arrow keys.
	if ( tagName === 'INPUT' ) {
		const simpleInputTypes = [
			'button',
			'checkbox',
			'color',
			'file',
			'image',
			'radio',
			'reset',
			'submit',
		];
		return simpleInputTypes.includes( element.getAttribute( 'type' ) );
	}

	// Native textareas should not navigate horizontally.
	return tagName !== 'TEXTAREA';
}

/**
 * Returns the optimal tab target from the given focused element in the desired
 * direction. A preference is made toward text fields, falling back to the block
 * focus stop if no other candidates exist for the block.
 *
 * @param {Element} target           Currently focused text field.
 * @param {boolean} isReverse        True if considering as the first field.
 * @param {Element} containerElement Element containing all blocks.
 * @param {boolean} onlyVertical     Whether to only consider tabbable elements
 *                                   that are visually above or under the
 *                                   target.
 *
 * @return {?Element} Optimal tab target, if one exists.
 */
export function getClosestTabbable(
	target,
	isReverse,
	containerElement,
	onlyVertical
) {
	// Since the current focus target is not guaranteed to be a text field, find
	// all focusables. Tabbability is considered later.
	let focusableNodes = focus.focusable.find( containerElement );

	if ( isReverse ) {
		focusableNodes.reverse();
	}

	// Consider as candidates those focusables after the current target. It's
	// assumed this can only be reached if the target is focusable (on its
	// keydown event), so no need to verify it exists in the set.
	focusableNodes = focusableNodes.slice(
		focusableNodes.indexOf( target ) + 1
	);

	let targetRect;

	if ( onlyVertical ) {
		targetRect = target.getBoundingClientRect();
	}

	function isTabCandidate( node ) {
		// Not a candidate if the node is not tabbable.
		if ( ! focus.tabbable.isTabbableIndex( node ) ) {
			return false;
		}

		// Skip focusable elements such as links within content editable nodes.
		if ( node.isContentEditable && node.contentEditable !== 'true' ) {
			return false;
		}

		if ( onlyVertical ) {
			const nodeRect = node.getBoundingClientRect();

			if (
				nodeRect.left >= targetRect.right ||
				nodeRect.right <= targetRect.left
			) {
				return false;
			}
		}

		return true;
	}

	return focusableNodes.find( isTabCandidate );
}

export default function useArrowNav() {
	const {
		getMultiSelectedBlocksStartClientId,
		getMultiSelectedBlocksEndClientId,
		getSettings,
		hasMultiSelection,
		__unstableIsFullySelected,
	} = useSelect( blockEditorStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	return useRefEffect( ( node ) => {
		// Here a DOMRect is stored while moving the caret vertically so
		// vertical position of the start position can be restored. This is to
		// recreate browser behaviour across blocks.
		let verticalRect;

		function onMouseDown() {
			verticalRect = null;
		}

		function isClosestTabbableABlock( target, isReverse ) {
			const closestTabbable = getClosestTabbable(
				target,
				isReverse,
				node
			);
			return closestTabbable && getBlockClientId( closestTabbable );
		}

		function onKeyDown( event ) {
			const { keyCode, target } = event;
			const isUp = keyCode === UP;
			const isDown = keyCode === DOWN;
			const isLeft = keyCode === LEFT;
			const isRight = keyCode === RIGHT;
			const isReverse = isUp || isLeft;
			const isHorizontal = isLeft || isRight;
			const isVertical = isUp || isDown;
			const isNav = isHorizontal || isVertical;
			const isShift = event.shiftKey;
			const hasModifier =
				isShift || event.ctrlKey || event.altKey || event.metaKey;
			const isNavEdge = isVertical ? isVerticalEdge : isHorizontalEdge;
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			// If there is a multi-selection, the arrow keys should collapse the
			// selection to the start or end of the selection.
			if ( hasMultiSelection() ) {
				// Only handle if we have a full selection (not a native partial
				// selection).
				if ( ! __unstableIsFullySelected() ) {
					return;
				}

				if ( event.defaultPrevented ) {
					return;
				}

				if ( ! isNav ) {
					return;
				}

				if ( isShift ) {
					return;
				}

				event.preventDefault();

				if ( isReverse ) {
					selectBlock( getMultiSelectedBlocksStartClientId() );
				} else {
					selectBlock( getMultiSelectedBlocksEndClientId(), -1 );
				}

				return;
			}

			// When presing any key other than up or down, the initial vertical
			// position must ALWAYS be reset. The vertical position is saved so
			// it can be restored as well as possible on sebsequent vertical
			// arrow key presses. It may not always be possible to restore the
			// exact same position (such as at an empty line), so it wouldn't be
			// good to compute the position right before any vertical arrow key
			// press.
			if ( ! isVertical ) {
				verticalRect = null;
			} else if ( ! verticalRect ) {
				verticalRect = computeCaretRect( defaultView );
			}

			// Abort if navigation has already been handled (e.g. RichText
			// inline boundaries).
			if ( event.defaultPrevented ) {
				return;
			}

			if ( ! isNav ) {
				return;
			}

			// Abort if our current target is not a candidate for navigation
			// (e.g. preserve native input behaviors).
			if ( ! isNavigationCandidate( target, keyCode, hasModifier ) ) {
				return;
			}

			// In the case of RTL scripts, right means previous and left means
			// next, which is the exact reverse of LTR.
			const isReverseDir = isRTL( target ) ? ! isReverse : isReverse;
			const { keepCaretInsideBlock } = getSettings();

			if ( isShift ) {
				if (
					isClosestTabbableABlock( target, isReverse ) &&
					isNavEdge( target, isReverse )
				) {
					node.contentEditable = true;
					// Firefox doesn't automatically move focus.
					node.focus();
				}
			} else if (
				isVertical &&
				isVerticalEdge( target, isReverse ) &&
				! keepCaretInsideBlock
			) {
				const closestTabbable = getClosestTabbable(
					target,
					isReverse,
					node,
					true
				);

				if ( closestTabbable ) {
					placeCaretAtVerticalEdge(
						closestTabbable,
						isReverse,
						verticalRect
					);
					event.preventDefault();
				}
			} else if (
				isHorizontal &&
				defaultView.getSelection().isCollapsed &&
				isHorizontalEdge( target, isReverseDir ) &&
				! keepCaretInsideBlock
			) {
				const closestTabbable = getClosestTabbable(
					target,
					isReverseDir,
					node
				);
				placeCaretAtHorizontalEdge( closestTabbable, isReverse );
				event.preventDefault();
			}
		}

		node.addEventListener( 'mousedown', onMouseDown );
		node.addEventListener( 'keydown', onKeyDown );
		return () => {
			node.removeEventListener( 'mousedown', onMouseDown );
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
