import "./Dashboard.css";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "../TrackSearchResut/TrackSearchResult";
import Player from "../Player/Player";
import axios from "axios";
import qs from "qs";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_CLIENT_ID,
});

const Dashboard = () => {
  //State
  const [accessToken, setAccessToken] = useState();
  const refreshToken = process.env.REACT_APP_REFRESH_TOKEN
  const [expiresIn, setExpiresIn] = useState();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState();

  //Actions
  function chooseTrack(track) {
    setPlayingTrack(track);
    setSearch("");
    setLyrics("");
  }

  //Efects
  useEffect(() => {
    var data = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    var config = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        Authorization: `Basic ${process.env.REACT_APP_AUTH}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        let data = response.data;
        setAccessToken(data.access_token);
        setExpiresIn(data.expires_in);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, [refreshToken]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    const interval = setInterval(() => {
      axios
        .post("https://lyrics-spotify-back.herokuapp.com/refresh", {
          refreshToken,
        })
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch(() => {
          window.location = "/";
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get("https://lyrics-spotify-back.herokuapp.com/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics);
      });
  }, [playingTrack]);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false;
    spotifyApi.searchTracks(search, { limit : 5}).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image;
              return smallest;
            },
            track.album.images[0]
          );

          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        })
      );
    });

    return () => (cancel = true);
  }, [search, accessToken]);

  //Render Methods
  const renderForm = () => {
    return (
      <div className="formContainer">
        <form>
          <input
            id="name"
            placeholder="Search Songs/Artists"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>
    );
  };

  return (
    <div className="containerD">
      {renderForm()}
      <div className="songs">
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
          />
        ))}
        {searchResults.length === 0 && (
          <div className="text-center" style={{ whiteSpace: "pre" }}>
            {lyrics}
          </div>
        )}
      </div>
      {accessToken && (
        <div className="bottom">
          <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
