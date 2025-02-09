import React, { useState } from 'react';
import classNames from 'classnames';

// Компонент іконки чекбоксу
function CheckboxIcon({ checked }) {
  if (checked === null) return null;
  
  return (
    <span className={classNames('menu-item__checkbox', {
      'menu-item__checkbox--checked': checked
    })}>
      {checked ? '✓' : '○'}
    </span>
  );
}

export function MenuItem({ item }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (item.id) {
      e.preventDefault();
      // Виконуємо клік на оригінальному елементі
      chrome.devtools.inspectedWindow.eval(
        `document.querySelector('#${item.id} a').click()`
      );
    }
  };

  return (
    <li className={classNames('menu-item', {
      'menu-item--has-children': hasChildren,
      'menu-item--open': isOpen
    })}>
      <a
        href={item.href}
        className="menu-item__link"
        onClick={handleClick}
      >
        <span className="menu-item__content">
          <CheckboxIcon checked={item.checked} />
          <span className="menu-item__text">{item.text}</span>
        </span>
        {hasChildren && (
          <span className="menu-item__arrow">▾</span>
        )}
      </a>
      {hasChildren && isOpen && (
        <ul className="menu-item__submenu">
          {item.children.map((child, index) => (
            <MenuItem key={child.id || index} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
