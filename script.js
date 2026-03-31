document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audioPlayer");
  const statusDisplay = document.getElementById("status");
  statusDisplay.textContent = "Paused";
  const currentSongDisplay = document.getElementById("current-song");
  const playlistSelector = document.getElementById("playlist-selector");
  const playlistDisplay = document.getElementById("playlist");
  const trackList = document.getElementById("track-list");
  const trackCount = document.getElementById("track-count");
  const cardTitle = document.getElementById("card-title");
  const cardSubtitle = document.getElementById("card-subtitle");
  const cardNote = document.getElementById("card-note");
  const senderAside = document.getElementById("sender-aside");
  const cardSender = document.getElementById("card-sender");
  const cardRecipient = document.getElementById("card-recipient");
  const transportButtons = document.querySelectorAll("[data-action]");

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
    songs: "Local",
    joanneCloud: "Joanne's SoundCloud",
    kevinCloud: "Kevin's SoundCloud"
  };

  // Initialize playlist display
  playlistDisplay.textContent = playlistNames.songs; // Set default
  hydrateCardCopy();
  renderTrackList();

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
    renderTrackList();
  });

  function hydrateCardCopy() {
    if (typeof cardConfig === "undefined") return;
    cardTitle.textContent = cardConfig.title || cardTitle.textContent;
    cardSubtitle.textContent = cardConfig.subtitle || cardSubtitle.textContent;
    cardNote.textContent = cardConfig.note || cardNote.textContent;
    if (senderAside) {
      if (cardConfig.senderAsideHtml) {
        senderAside.innerHTML = cardConfig.senderAsideHtml;
        senderAside.hidden = false;
      } else {
        senderAside.innerHTML = "";
        senderAside.hidden = true;
      }
    }
    cardSender.textContent = cardConfig.sender || cardSender.textContent;
    cardRecipient.textContent = cardConfig.recipient || cardRecipient.textContent;
  }

  function renderTrackList() {
    if (!trackList || !trackCount) return;

    if (currentPlaylistType === "soundcloud") {
      trackCount.textContent = "Streaming";
      trackList.innerHTML = `
        <div class="track-item">
          <div class="track-number">SC</div>
          <div class="track-meta">
            <strong>${playlistNames[playlistSelector.value]}</strong>
            <span>Use the player controls to browse the SoundCloud set.</span>
          </div>
        </div>
      `;
      return;
    }

    trackCount.textContent = `${currentPlaylist.length} song${currentPlaylist.length === 1 ? "" : "s"}`;
    trackList.innerHTML = "";

    currentPlaylist.forEach((song, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `track-item${index === currentSongIndex ? " is-active" : ""}`;
      item.innerHTML = `
        <span class="track-number">${index + 1}</span>
        <span class="track-meta">
          <strong>${song.name}</strong>
          <span>${song.artist}</span>
        </span>
      `;
      item.addEventListener("click", () => {
        playSong(index);
      });
      trackList.appendChild(item);
    });
  }

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
    document.getElementById('audioPlayer').style.display = 'block';

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
    renderTrackList();
  }

  function switchToSoundCloud(playlistKey) {
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
      renderTrackList();
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

  transportButtons.forEach(button => {
    button.addEventListener('click', function () {
      const action = this.getAttribute('data-action');

      if (currentPlaylistType === 'soundcloud' && soundcloudWidget) {
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
          default:
            console.warn('Unknown action:', action);
        }
      } else {
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
    renderTrackList();
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

  function syncBottomImageHeight() {
    const bottomImage = document.getElementById('pic80s');
    if (!bottomImage) return;
    bottomImage.style.height = '74px';
    bottomImage.style.width = '74px';
  }

  // Call on load and resize
  syncBottomImageHeight();
  window.addEventListener('resize', syncBottomImageHeight);
});
