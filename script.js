document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audioPlayer");
  const statusDisplay = document.getElementById("status");
  statusDisplay.textContent = "Paused";
  const currentSongDisplay = document.getElementById("current-song");
  const playerContainer = document.querySelector(".player-container");
  const playlistSelector = document.getElementById("playlist-selector");
  const playlistDisplay = document.getElementById("playlist");

  let currentSongIndex = 0;
  let currentPlaylist = songs; // Default playlist
  let currentPlaylistType = 'local'; // 'local' or 'soundcloud'
  let soundcloudWidget = null;

  // SoundCloud playlist URLs
  const soundcloudPlaylists = {
    joanneCloud: "https://soundcloud.com/kjwagner613/sets/soundcloud-1",
    kevinCloud: "https://soundcloud.com/kjwagner613/sets/soundcloud-2"
  };

  // Playlist management - declare these first
  const playlists = {
    songs: songs,           // Kevin's Local
    joanneCloud: [],       // Will be populated from SoundCloud
    kevinCloud: []         // Will be populated from SoundCloud
  };

  const playlistNames = {
    songs: "Kevin's Local",
    joanneCloud: "Joanne's SoundCloud",
    kevinCloud: "Kevin's SoundCloud"
  };

  // Initialize playlist display
  playlistDisplay.textContent = playlistNames.songs; // Set default

  // Debug: Check if playlist selector has all options
  setTimeout(() => {
    const options = playlistSelector.querySelectorAll('option');
    console.log('Playlist options found:', options.length);
    options.forEach((option, index) => {
      console.log(`Option ${index}: ${option.value} - ${option.textContent}`);
    });
  }, 1000);

  // Handle playlist selection
  playlistSelector.addEventListener('change', function () {
    const selectedPlaylist = this.value;
    playlistDisplay.textContent = playlistNames[selectedPlaylist];

    if (selectedPlaylist === 'joanneCloud' || selectedPlaylist === 'kevinCloud') {
      // Switch to SoundCloud mode
      switchToSoundCloud(selectedPlaylist);
    } else {
      // Switch to local mode
      switchToLocal(selectedPlaylist);
    }
  });

  function switchToLocal(playlistKey) {
    currentPlaylistType = 'local';
    currentPlaylist = playlists[playlistKey];
    currentSongIndex = 0;

    // Stop SoundCloud player if it's playing
    if (soundcloudWidget) {
      soundcloudWidget.pause();
    }

    // Hide SoundCloud widget, show audio player
    document.getElementById('soundcloud-container').style.display = 'none';
    document.getElementById('audioPlayer').style.display = 'none';

    // Find first playable song in playlist
    let firstPlayableIndex = 0;
    for (let i = 0; i < currentPlaylist.length; i++) {
      if (currentPlaylist[i].play) {
        firstPlayableIndex = i;
        break;
      }
    }

    // Load the first song but don't auto-play
    playSong(firstPlayableIndex, false);
  } function switchToSoundCloud(playlistKey) {
    currentPlaylistType = 'soundcloud';
    currentSongIndex = 0;

    // Stop and pause the local audio player
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    // Hide audio player, show SoundCloud widget
    const soundcloudContainer = document.getElementById('soundcloud-container');

    audioPlayer.style.display = 'none';
    soundcloudContainer.style.display = 'block';
    soundcloudContainer.style.width = '100%';
    soundcloudContainer.style.height = '166px';

    // Load SoundCloud playlist
    const playlistUrl = soundcloudPlaylists[playlistKey];
    const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;

    const iframe = document.getElementById('soundcloud-widget');
    iframe.src = widgetUrl;

    // Check if SC (SoundCloud) is available
    if (typeof SC === 'undefined') {
      statusDisplay.textContent = "SoundCloud API Error";
      currentSongDisplay.innerHTML = "SoundCloud API not loaded";
      return;
    }

    // Initialize SoundCloud widget
    soundcloudWidget = SC.Widget(iframe);
    soundcloudWidget.bind(SC.Widget.Events.READY, function () {
      updateStatusForSoundCloud();
    });

    soundcloudWidget.bind(SC.Widget.Events.PLAY, function () {
      updateStatusForSoundCloud("Playing");
    });

    soundcloudWidget.bind(SC.Widget.Events.PAUSE, function () {
      updateStatusForSoundCloud("Paused");
    });
  }

  function updateStatusForSoundCloud(status = "Ready") {
    if (soundcloudWidget) {
      soundcloudWidget.getCurrentSound(function (currentSound) {
        if (currentSound) {
          statusDisplay.textContent = status;
          currentSongDisplay.innerHTML = `${currentSound.title}<br>${currentSound.user.username}`;
        } else {
          statusDisplay.textContent = status;
          currentSongDisplay.innerHTML = "SoundCloud Playlist";
        }
      });
    }
  }

  document.querySelectorAll('area[data-action]').forEach(area => {
    area.addEventListener('click', function (event) {
      event.preventDefault();
      const action = this.getAttribute('data-action');

      if (currentPlaylistType === 'soundcloud' && soundcloudWidget) {
        // Handle SoundCloud controls
        switch (action) {
          case 'prev':
            soundcloudWidget.prev();
            break;
          case 'play':
            soundcloudWidget.play();
            break;
          case 'pause':
            soundcloudWidget.pause();
            break;
          case 'next':
            soundcloudWidget.next();
            break;
          case 'songlist':
            localStorage.setItem("currentPlaylistKey", playlistSelector.value);
            window.location.href = 'songlist.html';
            break;
          case 'medallion':
            alert('Medallion feature coming soon!');
            break;
          default:
            console.warn('Unknown action:', action);
        }
      } else {
        // Handle local file controls
        switch (action) {
          case 'prev':
            playPrevSong();
            break;
          case 'play':
            audioPlayer.play();
            break;
          case 'pause':
            audioPlayer.pause();
            break;
          case 'next':
            playNextSong();
            break;
          case 'songlist':
            localStorage.setItem("currentPlaylistKey", playlistSelector.value);
            window.location.href = 'songlist.html';
            break;
          case 'medallion':
            alert('Medallion feature coming soon!');
            break;
          default:
            console.warn('Unknown action:', action);
        }
      }
    });
  });



  function playSong(index, autoPlay = true) {
    audioPlayer.src = currentPlaylist[index].file;
    if (autoPlay) {
      audioPlayer.play().catch((error) => {
        console.error("Error playing song:", error);
      });
      updateStatus("Playing", currentPlaylist[index].name);
    } else {
      audioPlayer.load();
      updateStatus("Paused", currentPlaylist[index].name);
    }
    currentSongIndex = index;
  }

  function updateStatus(status, songName) {
    statusDisplay.textContent = status;
    const currentSong = currentPlaylist[currentSongIndex];
    currentSongDisplay.innerHTML = `${currentSong.name}<br>${currentSong.artist}`;
  }

  audioPlayer.addEventListener("ended", () => {
    playNextSong();
  });

  audioPlayer.addEventListener("play", () => {
    updateStatus("Playing", currentPlaylist[currentSongIndex].name);
  });
  audioPlayer.addEventListener("pause", () => {
    updateStatus("Paused", currentPlaylist[currentSongIndex].name);
  });

  function playNextSong() {
    let nextIndex = currentSongIndex;
    let found = false;
    for (let i = 0; i < currentPlaylist.length; i++) {
      nextIndex = (nextIndex + 1) % currentPlaylist.length;
      if (currentPlaylist[nextIndex].play) {
        found = true;
        break;
      }
    }
    if (found) {
      playSong(nextIndex);
    } else {
      updateStatus("No songs selected to play", "");
      audioPlayer.pause();
    }
  }



  function playPrevSong() {
    let prevIndex = currentSongIndex;
    let found = false;
    for (let i = 0; i < currentPlaylist.length; i++) {
      prevIndex = (prevIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      if (currentPlaylist[prevIndex].play) {
        found = true;
        break;
      }
    }
    if (found) {
      playSong(prevIndex);
    } else {
      updateStatus("No songs selected to play", "");
      audioPlayer.pause();
    }
  }


  const selectedSongIndex = localStorage.getItem("selectedSongIndex");
  const selectedPlaylistKey = localStorage.getItem("selectedPlaylistKey");

  if (selectedSongIndex !== null) {
    // If a playlist was selected from song list, switch to it
    if (selectedPlaylistKey && playlists[selectedPlaylistKey]) {
      currentPlaylist = playlists[selectedPlaylistKey];
      playlistSelector.value = selectedPlaylistKey;
      playlistDisplay.textContent = playlistNames[selectedPlaylistKey];
    }
    playSong(parseInt(selectedSongIndex));
    localStorage.removeItem("selectedSongIndex");
    localStorage.removeItem("selectedPlaylistKey");
  } else {
    playSong(0);
  }

  // Responsive image map functionality
  function makeImageMapResponsive() {
    const img = document.querySelector('img[usemap="#image-map"]');
    const map = document.querySelector('map[name="image-map"]');
    if (!img || !map) return;
    const areas = map.querySelectorAll('area');

    if (!img || !areas.length) return;

    if (!img.naturalWidth || !img.naturalHeight) return;

    areas.forEach(area => {
      if (!area.hasAttribute('data-original-coords')) {
        area.setAttribute('data-original-coords', area.getAttribute('coords'));
      }
    });

    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    const circleScale = Math.min(scaleX, scaleY);

    areas.forEach(area => {
      const originalCoords = area.getAttribute('data-original-coords').split(',').map(Number);
      const shape = area.getAttribute('shape');

      if (shape === 'circle') {
        const newCoords = [
          Math.round(originalCoords[0] * scaleX),
          Math.round(originalCoords[1] * scaleY),
          Math.round(originalCoords[2] * circleScale)
        ];
        area.setAttribute('coords', newCoords.join(','));
      } else if (shape === 'rect') {
        const newCoords = [
          Math.round(originalCoords[0] * scaleX),
          Math.round(originalCoords[1] * scaleY),
          Math.round(originalCoords[2] * scaleX),
          Math.round(originalCoords[3] * scaleY)
        ];
        area.setAttribute('coords', newCoords.join(','));
      }
    });
  }

  function syncBottomImageHeight() {
    const playerHeadImage = document.querySelector('img[usemap="#image-map"]');
    const bottomImage = document.getElementById('pic80s');
    if (!playerHeadImage || !bottomImage) return;
    if (!playerHeadImage.clientHeight) return;
    bottomImage.style.height = `${playerHeadImage.clientHeight}px`;
    bottomImage.style.width = 'auto';
  }

  // Call on load and resize
  makeImageMapResponsive();
  syncBottomImageHeight();
  window.addEventListener('resize', makeImageMapResponsive);
  window.addEventListener('resize', syncBottomImageHeight);

  // Also call after image loads to ensure proper scaling
  const playerImage = document.querySelector('img[usemap="#image-map"]');
  if (playerImage) {
    playerImage.addEventListener('load', () => {
      makeImageMapResponsive();
      syncBottomImageHeight();
    });
  }

});
