'use strict';

var React = require('react');
var Reflux = require('reflux');
var Router = require('react-router');
var Link = Router.Link;

var appStore = require('../../stores/application_store');
var actions = require('../../actions/actions');

module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  mixins: [
    Reflux.connect(appStore, 'appSettings')
  ],

  toggle: function(e) {
    e.preventDefault();
    actions.sidebarToggled();
  },

  render: function() {
    var appSettings = this.state.appSettings;
    var toggleClass = 'sidebar-toggle quiet block fl keyline-right animate pad1 row-60';
    if (appSettings.sidebar) toggleClass += ' active';
    var currentTask = this.context.router.getCurrentParams().task;

    return (
      /* jshint ignore:start */
      <header className='fill-light keyline-bottom row-60 col12 clearfix mobile-cols'>
        <nav className='col6 truncate'>
          <a href='#' onClick={this.toggle} className={toggleClass}>
            <span className='icon big menu'></span>
          </a>
          <a href='/to-fix/' className='pad2x'>
            <h1 className='inline fancy title'>to-fix</h1>
          </a>
        </nav>
        <div className='col6 truncate text-right pad1'>
          <nav className='col12 space pad0y'>
            <Link
              className='icon pencil short button'
              params={{ task: currentTask }}
              to='task'>
              Task
            </Link>
            <Link
              className='icon bolt short button'
              params={{ task: currentTask }}
              to='activity'>
              Activity
            </Link>
            <Link
              className='icon graph short button'
              params={{ task: currentTask }}
              to='stats'>
              Statistics
            </Link>
          </nav>
        </div>
      </header>
      /* jshint ignore:end */
    );
  }
});
