import "./TrackSearchResult.css";
const TrackSearchResult = ({track, chooseTrack}) => {
    function handlePlay(){
        chooseTrack(track)
    }
    

    return ( 
        <div className="songContainer"
        onClick={handlePlay}>
            <img src={track.albumUrl} alt="" />
            <div>
                <div className="title"><p>{track.title}</p></div>
                <div className="artist">{track.artist}</div>
            </div>
        </div>
     );
}
 
export default TrackSearchResult;