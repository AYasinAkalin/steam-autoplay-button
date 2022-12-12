__RELEASE = true;
__DEBUG = false;

// Construct URL for local PNG file
const url_checkmarked = browser.runtime.getURL('../steam-autoplay-checked-checkmark.png');

////////////////////////////////////////////////////////////////////////////////
//////////////////// Construct CSS class `customCheckmark` /////////////////////
const style_styling = `background-image: url("${url_checkmarked}") !important;`;
const style = Object.assign(
  document.createElement('style'),
  {type: 'text/css', innerText: `.customCheckmark {${style_styling}}`});
document.querySelector('head').appendChild(style);
// var style = document.createElement('style');
// style.type = 'text/css';
// const style_styling = `background-image: url("${url_checkmarked}") !important;`;
// style.innerHTML = ".customCheckmark {" + style_styling + "}";
// document.getElementsByTagName('head')[0].appendChild(style);
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
/////////////// DON'T REMOVE OR RENAME THESE VARIABLES ////////////////////////
// Reach DOM element to be edited
const videoPlayerCssSelector = '#highlight_player_area>.highlight_movie';
const videoPlayers = document.querySelectorAll(videoPlayerCssSelector);

// There is only one active video at any given time
let activeVid = {
  'id': "",
  'button': null,
  'cssSelectorVid': "",
  'cssSelectorButton': ""
}
// Keep count of non-playing videos
let passiveVideos = 0;
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function __replaceActiveVid(videoObject) {
  /**
   * Replaces global variable activeVid's content
   * with current active (playing) video's HTML information
   */
  activeVid.id = videoObject.id;
  activeVid.button = videoObject.button;
  activeVid.cssSelectorVid = `${videoPlayerCssSelector}#${videoObject.id}`;
  activeVid.cssSelectorButton = `${videoPlayerCssSelector}#${videoObject.id} .autoplay_checkbox`;
}

function __checkVideoPlayers (vpDomElemList, exitAfterActive=false) {
  /**
   * Returns a list of Javascript Objects. 1 Object for 1 video
   * Each Object has 3 elements
   * {
   *   'id':                // ID of the video container. Also acts as HTML Node id attribute
   *   "active":            // Boolean
   *   'cssSelectorButton': // CSS selector of the autoplay button in the video container
   * }
   */
  let videos = [];
  vpDomElemList.forEach(elem => {
    let vid = {
      'id': elem.getAttribute('id'),
      "active": false,
      'cssSelectorButton': `${videoPlayerCssSelector}#${elem.getAttribute('id')} .autoplay_checkbox`
    }
    if(elem.hasAttribute('style')){
      if (elem.style.display === 'none') {
        passiveVideos++;
      }
      else {
        vid.active = true;
        __replaceActiveVid(vid);
        if (exitAfterActive) { return; }
      }
    }
    videos.push(vid);
  });
  return videos;
}

function detectActiveVideo() {
  /**
   * Detects if a video is active (playing or ready to play) on steam store page
   * If so, changes are reflected in global variable activeVid's content
   * 
   * Returns nothing
   */
  __checkVideoPlayers(document.querySelectorAll(videoPlayerCssSelector),true);
}

function getActivesAutoPlayButton(){
  /**
   * If a video is active (playing or ready to play) on steam store page,
   * return autoplay button
   * Else return NULL
   */
  detectActiveVideo();
  if (activeVid.id === "") { return null; }
  return document.body.querySelector(`${activeVid.cssSelectorButton}`);
}


function __replaceOnFirstLoad(buttonNode){
  /**
   * When page loads, if button is active, replace icon
   * This function is intented for single-use only.
   * 
   * Use convertButton(buttonNode) for better results.
   */
  if (buttonNode === null) { return; }
  if (buttonNode.classList.contains("checked")){
    // Adding styling instead of class is faster when page loads first
    // It allows instant replacing of X with checkmark
    buttonNode.style.backgroundImage = `url('${url_checkmarked}')`;

    // When class adding method is used, user first sees default X, then checkmark replaces it.
    // Replacement can easily be detected by naked eye.
    // buttonNode.classList.add("customCheckmark");
  }
}

function __handleClick(e){
  /**
   * Handles clicks on autoplay checkmark button
   */
    if (this.classList.contains("checked")){
      // Remove single-use styling if present
      this.style.removeProperty("background-image");
      this.classList.add("customCheckmark");
    }
    else {
      // Remove single-use styling if present
      this.style.removeProperty("background-image");
      this.classList.remove("customCheckmark");
    }
}

function convertButton(buttonNode){
  if (buttonNode === null) { 
    return;
  }
  __replaceOnFirstLoad(buttonNode);
  // Listens for clicks on the button
  buttonNode.addEventListener('click', __handleClick);
}


detectActiveVideo();
if (__DEBUG) {
  console.log(`In total (${videoPlayers.length}) videos are found.`);
  console.log(`(${videoPlayers.length - passiveVideos}) of them are active.`);
  console.log(`(${passiveVideos}) of them are passive.`);
}
if (activeVid.id === ""){
  // Initial button is NULL.
  // Either page load to game picture (user has autoplay videos disabled)
  // or game's Steam store page doesn't contain a video
  var autoplaybutton = null;
} else {
  // Page loads and a video starts playing.
  var autoplaybutton = getActivesAutoPlayButton();

  // Button is detected. Cross converts to checkmark
  convertButton(autoplaybutton);
}




////////////////////////////////////////////////////////////////////////////////
///////////////////// LISTENING FOR CHANGES OF ACTIVE VIDEO ////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
 * DOM element of each video of a game on Steam page contains its own player
 * Therefore each there are as many unique autoplay buttons as number of videos
 * So we watch the page if selected video changes.
 */
// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: false, subtree: false };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === 'attributes') {
      const prevId = activeVid.id;

      // getActivesAutoPlayButton() may change activeVid, so it's 'id' value
      const autoplaybutton2 = getActivesAutoPlayButton();

      if (prevId === activeVid.id) { /* Video is not changed, do nothing */ }
      else {
        // Video is changed
        if (__DEBUG) { console.log("Video is changed"); }
        
        // Remove event listener
        // DISABLED DUE TO GAME STOPPING ERRORS
        // autoplaybutton.removeListener('click', __handleClick);
        // console.log("Event listener removed");
        
        // Change active button
        autoplaybutton = autoplaybutton2;
        if (__DEBUG) { console.log("Active button changed"); }

        // Run initial replacer and Insert event listener
        convertButton(autoplaybutton);
        if (__DEBUG) { console.log("Active button is converted"); }
      }
    } else if (mutation.type === 'childList') {
      // console.log('A child node has been added or removed.');
    } else if (mutation.type === 'subtree') {
      // console.log(`Subtree was modified.`);
    }
  }
};

// Create an observer instance linked to the callback function
const videoPlayerObserver = new MutationObserver(callback);


// Select the node that will be observed for mutations
// targetNode contains video players for each video of a game on Steam page.
// Each video contains its own player, therefore contains a unique autoplay button
const targetNode = document.querySelector('#highlight_player_area');

// Start observing the target node for configured mutations
// videoPlayerObserver.observe(targetNode, config);

videoPlayers.forEach(player => {
  videoPlayerObserver.observe(player, config);
});
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
