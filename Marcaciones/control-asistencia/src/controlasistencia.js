import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import moment from 'moment';
import './controlasistencia.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';


function ControlAsistencia() {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    //const [cargandoMarcaciones, setCargandoMarcaciones] = useState(false);
    const [marcaciones, setMarcaciones] = useState([]);
    const [legajoFiltrar, setLegajoFiltrar] = useState('');
    const [cargando, setCargando] = useState(false);
    const [totalMarcaciones, setTotalMarcaciones] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(10);
    const [legajoReloj, setLegajoReloj] = useState('');

    useEffect(() => {
        loadMoreMarcaciones();
    }, []); // Carga inicial de marcaciones

    const loadMoreMarcaciones = async () => {
        if (currentPage >= totalPages || cargando) return;
        try {
            setCargando(true);
            const response = await axios.get(`http://localhost:3000/marcaciones?page=${currentPage + 1}`);
            setMarcaciones(prevMarcaciones => [...prevMarcaciones, ...response.data.data]);
            setCurrentPage(prevPage => prevPage + 1);
        } catch (error) {
            console.error('Error al cargar más marcaciones:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleClickPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Luego, en el componente de paginación:

    {
        Array.from({ length: totalPages }, (_, index) => (
            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handleClickPage(index + 1)}>
                    {index + 1}
                </button>
            </li>
        ))
    }

    const buscarDesdeReloj = async (legajoReloj) => {
        try {
            setCargando(true);
            const response = await axios.get(`http://localhost:3000/buscarDesdeReloj/${legajoReloj}`);
            console.log('Datos recibidos desde el reloj:', response.data);
    
            // Actualiza el estado del componente con las marcaciones recibidas
            setMarcaciones(response.data.data);
            setMarcaciones(response.data.data);
            setTotalMarcaciones(response.data.data.length); // Actualizar contador
            setCargando(false);
    
        } catch (error) {
            console.error('Error al buscar marcaciones desde el reloj:', error);
            // Manejar el error si ocurre
        }
    };

    const handleScroll = () => {
        const marcacionesContainer = document.getElementById("marcaciones-container");
        if (!marcacionesContainer) return; // Salir si no se encuentra el contenedor
        const { scrollTop, clientHeight, scrollHeight } = marcacionesContainer;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            loadMoreMarcaciones();
        }
    };

    useEffect(() => {
        const marcacionesContainer = document.getElementById("marcaciones-container");
        if (marcacionesContainer) {
            marcacionesContainer.addEventListener('scroll', handleScroll);
            return () => {
                marcacionesContainer.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(totalMarcaciones / perPage);
        setTotalPages(totalPages);
    }, [totalMarcaciones, perPage]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const buscarPorLegajo = async () => {
        try {
            setCargando(true);
            // const fechaInicioFormateada = moment(fechaInicio).format('YYYY-MM-DD');
            // const fechaFinFormateada = moment(fechaFin).format('YYYY-MM-DD');
            const response = await axios.get(`http://localhost:3000/buscarPorLegajo/${legajoFiltrar}`);

            const marcacionesFormateadas = response.data.data.map(marcacion => ({
                ...marcacion,
                fecha: moment.utc(marcacion.fecha).format('YYYY-MM-DD'),
                hora: moment.utc(marcacion.hora, 'HH:mm:ss').format('HH:mm')
            }));

            setMarcaciones(marcacionesFormateadas);
            setTotalMarcaciones(marcacionesFormateadas.length);
            setTotalPages(response.data.totalPages);
            setCurrentPage(1);
            setCargando(false);
        } catch (error) {
            console.error('Error al filtrar las marcaciones:', error);
            setCargando(false);
        }
    };

    // const insertarMarcaciones = async () => {
    //     try {
    //         if (!fechaInicio || !fechaFin) {
    //             throw new Error('Por favor, ingrese la fecha de inicio y la fecha de fin.');
    //         }
    
    //         const marcacionesFiltradas = marcaciones.filter(marcacion => {
    //             const marcacionDate = moment(marcacion.fecha, 'YYYY-MM-DD');
    //             const startDate = moment(fechaInicio, 'YYYY-MM-DD');
    //             const endDate = moment(fechaFin, 'YYYY-MM-DD');
    //             return marcacionDate.isSameOrAfter(startDate) && marcacionDate.isSameOrBefore(endDate);
    //         });
    
    //         await Promise.all(marcacionesFiltradas.map(async marcacion => {
    //             const existe = await verificarExistenciaMarcacion(marcacion);
    //             const data = {
    //                 legajo: marcacion.legajo,
    //                 fecha: moment(marcacion.fecha, 'YYYY-MM-DD').format('YYYY-MM-DD'),
    //                 hora: moment(marcacion.hora, 'HH:mm').format('HH:mm'),
    //                 desde: marcacion.desde,
    //                 observacion: marcacion.observacion,
    //                 control: marcacion.control,
    //                 relojnro: marcacion.relojnro,
    //                 remunerado: marcacion.remunerado
    //             };
    
    //             const response = await axios.post('http://localhost:3000/insertarMarcacion', data);
    
    //             if (response.status !== 201) {
    //                 throw new Error(`Error al insertar la marcación: ${response.statusText}`);
    //             }
    //         }));
    
    //         console.log('Todas las marcaciones filtradas han sido procesadas exitosamente');
    //     } catch (error) {
    //         console.error('Error al procesar las marcaciones:', error.message);
    //     }
    // };
    const insertarMarcaciones = async () => {
        try {
            if (!fechaInicio || !fechaFin) {
                throw new Error('Por favor, ingrese la fecha de inicio y la fecha de fin.');
            }
    
            // Filtrar las marcaciones por las fechas de inicio y fin
            const marcacionesFiltradas = marcaciones.filter(marcacion => {
                const marcacionDate = moment(marcacion.fecha, 'YYYY-MM-DD');
                const startDate = moment(fechaInicio, 'YYYY-MM-DD');
                const endDate = moment(fechaFin, 'YYYY-MM-DD');
                return marcacionDate.isSameOrAfter(startDate) && marcacionDate.isSameOrBefore(endDate);
            });
    
            // Iterar sobre las marcaciones filtradas para insertarlas
            await Promise.all(marcacionesFiltradas.map(async marcacion => {
                // Datos a enviar al servidor
                const data = {
                    legajo: marcacion.legajo,
                    fecha: moment(marcacion.fecha, 'YYYY-MM-DD').format('YYYY-MM-DD'),
                    hora: moment(marcacion.hora, 'HH:mm').format('HH:mm'),
                    desde: marcacion.desde,
                    observacion: marcacion.observacion,
                    control: marcacion.control,
                    relojnro: marcacion.relojnro,
                    remunerado: marcacion.remunerado
                };
    
                // Realizar la solicitud POST al servidor para insertar la marcación
                const response = await axios.post('http://localhost:3000/insertarMarcacion', data);
    
                // Verificar si la solicitud fue exitosa
                if (response.status !== 201) {
                    throw new Error(`Error al insertar la marcación: ${response.statusText}`);
                }
            }));
    
            // Mostrar mensaje de completado
            alert('Marcaciones insertadas correctamente');
        } catch (error) {
            console.error('Error al procesar las marcaciones:', error.message);
            alert('Error al insertar marcaciones. Por favor, inténtalo de nuevo.');
        }
    };

    // const verificarExistenciaMarcacion = async (marcacion) => {
    //     try {
    //         const response = await axios.get('http://localhost:3000/verificarExistenciaMarcacion', {
    //             params: {
    //                 legajo: marcacion.legajo,
    //                 fecha: marcacion.fecha,
    //                 hora: marcacion.hora
    //             }
    //         });

    //         return response.data.existe;
    //     } catch (error) {
    //         console.error('Error al verificar la existencia de la marcación:', error.message);
    //         return false;
    //     }
    // };
    

    useEffect(() => {
        //obtenerMarcaciones();
    }, []);

    const obtenerMarcaciones = async () => {
        try {
            setCargando(true);
            const response = await axios.get('http://localhost:3000/marcaciones');
            setMarcaciones(response.data.data);
            setTotalMarcaciones(response.data.data.length); // Actualizar contador
            setCargando(false);
        } catch (error) {
            console.error('Error al obtener las marcaciones:', error);
            setCargando(false);
        }
    };

    const descargarMarcaciones = async () => {
        try {
            let url = 'http://localhost:3000/marcaciones';
            const params = {
                fechaInicio: fechaInicio,
                fechaFin: fechaFin
            };

            // Si legajoFiltrar está definido, agregarlo como un parámetro de consulta
            if (legajoFiltrar) {
                url += `/buscarPorLegajo/${legajoFiltrar}`;
            }

            // Realizar la solicitud GET al servidor para obtener los datos de las marcaciones
            const response = await axios.get(url, { params });

            // Verificar si la solicitud fue exitosa
            if (response.status === 200) {
                const marcaciones = response.data.data; // Suponiendo que el servidor devuelve los datos en formato JSON

                // Convertir datos a formato de hoja de cálculo
                const data = marcaciones.map(marcacion => [marcacion.legajo, marcacion.hora, marcacion.fecha]);
                const ws = XLSX.utils.aoa_to_sheet([['Legajo', 'Hora', 'Fecha'], ...data]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Marcaciones');

                // Descargar el archivo Excel
                XLSX.writeFile(wb, 'marcaciones.xlsx');
            } else {
                console.error('Error al descargar las marcaciones:', response.statusText);
                // Manejar el error, por ejemplo, mostrar un mensaje al usuario
            }
        } catch (error) {
            console.error('Error al descargar las marcaciones:', error);
            // Manejar el error, por ejemplo, mostrar un mensaje al usuario
        }
    };

    const mostrarEstadoConexion = () => {
        if (cargando) {
            return (
                <Modal show={cargando} backdrop="static" keyboard={false} centered className="transparent-modal">
                    <Modal.Body>
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            );
        }
        return null; // Si no se está cargando, no se muestra ningún mensaje
    };

    const calculateRange = () => {
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        return { startIndex, endIndex };
    };

    const { startIndex, endIndex } = calculateRange();
    const visibleMarcaciones = marcaciones.slice(startIndex, endIndex);

    return (
        <div style={{ margin: '20px' }}>
            <div className="container-margin mb-0">
                {/* <div className="container-margin"> */}
                <div className="row">
                    <div className="col-md-6">
                        <div className="card border rounded">
                            <div className="card-body">
                                <h2 className="mb-0 mx-auto text-center">Marcaciones guardadas</h2>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group mb-4">
                                            <label htmlFor="legajoInput">Búsqueda por Legajo</label>
                                            <div className="d-flex align-items-center mb-2">
                                                <input type="text" id="legajoInput" className="form-control mr-2" value={legajoFiltrar} onChange={(e) => setLegajoFiltrar(e.target.value)} />
                                            </div>
                                            <button className="btn btn-primary" onClick={buscarPorLegajo}>Buscar</button>
                                        </div>
                                    </div>
                                </div>
                                {mostrarEstadoConexion()}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card border rounded">
                            <div className="card-body">
                                <h2 className="mb-0 mx-auto text-center">Tiempo Real</h2>
                                <div>
                                    <p style={{ fontWeight: 'bold' }}>Total de marcaciones: {totalMarcaciones}</p>
                                </div>
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="col-md-12 mb-3">
                                            <button className="btn btn-warning" onClick={obtenerMarcaciones}>Actualizar reloj</button>
                                            <button className="btn btn-primary ml-1" onClick={descargarMarcaciones}>
                                                <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="form-group d-flex align-items-center">
                                                <label htmlFor="fechaInicioInput" className="mr-custom">Desde:</label>
                                                <input type="date" id="fechaInicioInput" className="form-control mr-2" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                                                <label htmlFor="fechaFinInput" className="mr-custom">Hasta:</label>
                                                <input type="date" id="fechaFinInput" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                                                <button className="btn btn-success" onClick={insertarMarcaciones}>
                                                    <FontAwesomeIcon icon={faSave} />
                                                </button>
                                                <input type="text" id="buscarDesdeRelojInput" className="form-control mr-2" value={legajoReloj} onChange={(e) => setLegajoReloj(e.target.value)} placeholder="Legajo" />
                            <button className="btn btn-info" onClick={() => buscarDesdeReloj(legajoReloj)}>Buscar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="mb-0 mx-auto text-center">Marcaciones</h2>
                    <div className="text-right">
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '20%' }}>Legajo</th>
                                <th className="text-center" style={{ width: '20%' }}>Fecha</th>
                                <th className="text-center" style={{ width: '20%' }}>Hora</th>
                                <th className="text-center" style={{ width: '20%' }}>Reloj</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleMarcaciones.map((marcacion, index) => (
                                <tr key={index}>
                                    <td className="text-center">{marcacion.legajo}</td>
                                    <td className="text-center">{marcacion.fecha}</td>
                                    <td className="text-center">{marcacion.hora}</td>
                                    <td className="text-center">{marcacion.relojnro}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <footer className="footer">
                <div className="container">
                    <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(1)}>&laquo;&laquo;</button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>&laquo;</button>
                            </li>
                            <li className="page-item disabled">
                                <button className="page-link">
                                    Páginas {currentPage} de {totalPages}
                                </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>&raquo;</button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>&raquo;&raquo;</button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </footer>
        </div>
    );
}

export default ControlAsistencia;